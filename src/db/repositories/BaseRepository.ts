/**
 * Base Repository Pattern Implementation
 * Provides sophisticated data access layer with advanced features
 * 
 * Features:
 * - CRUD operations with validation
 * - Query builder pattern
 * - Pagination and cursor-based navigation
 * - Soft delete support
 * - Audit trail
 * - Caching strategy
 * - Batch operations
 * - Relationships and eager loading
 * - Optimistic locking
 * - Query optimization
 */

import { Table, Collection, IndexableType } from 'dexie'
import { db } from '../schema'
import { databaseManager } from '../DatabaseManager'
import { v4 as uuidv4 } from 'uuid'

export interface QueryOptions<T> {
  where?: Partial<T>
  orderBy?: keyof T | Array<keyof T>
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
  include?: string[] // For eager loading relationships
  select?: Array<keyof T> // Projection
  distinct?: boolean
  groupBy?: Array<keyof T>
  having?: (item: T) => boolean
  cache?: boolean
  cacheTTL?: number
}

export interface PaginationOptions {
  page: number
  pageSize: number
  cursor?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  cursor?: string
}

export interface AuditInfo {
  createdAt: Date
  createdBy?: string
  updatedAt?: Date
  updatedBy?: string
  version: number
}

export interface SoftDeletable {
  isDeleted?: boolean
  deletedAt?: Date
  deletedBy?: string
}

export interface BaseEntity extends AuditInfo, SoftDeletable {
  id: string
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected table: Table<T, string>
  protected tableName: string
  protected relationships: Map<string, RelationshipConfig>
  protected validationRules: Map<string, any[]>
  protected indexes: Set<keyof T>
  protected softDelete: boolean
  
  constructor(tableName: string, softDelete: boolean = false) {
    this.table = db.table(tableName) as Table<T, string>
    this.tableName = tableName
    this.relationships = new Map()
    this.validationRules = new Map()
    this.indexes = new Set()
    this.softDelete = softDelete
    
    this.setupRelationships()
    this.setupValidation()
    this.setupIndexes()
  }
  
  /**
   * Setup relationships - to be overridden by child classes
   */
  protected abstract setupRelationships(): void
  
  /**
   * Setup validation rules - to be overridden by child classes
   */
  protected abstract setupValidation(): void
  
  /**
   * Setup indexes - to be overridden by child classes
   */
  protected abstract setupIndexes(): void
  
  /**
   * Find by ID with optional eager loading
   */
  async findById(id: string, options?: { include?: string[] }): Promise<T | null> {
    let query = this.softDelete 
      ? this.table.where('id').equals(id).and(item => !item.isDeleted)
      : this.table.where('id').equals(id)
    
    const result = await query.first()
    
    if (result && options?.include) {
      return this.loadRelationships(result, options.include)
    }
    
    return result || null
  }
  
  /**
   * Find all with advanced query options
   */
  async findAll(options?: QueryOptions<T>): Promise<T[]> {
    let collection: Collection<T, IndexableType>
    
    // Build query
    if (options?.where) {
      const whereClause = Object.entries(options.where)[0]
      if (whereClause) {
        const [field, value] = whereClause
        collection = this.table.where(field as string).equals(value as IndexableType)
        
        // Add additional where clauses
        for (const [field, value] of Object.entries(options.where).slice(1)) {
          collection = collection.and(item => (item as any)[field] === value)
        }
      } else {
        collection = this.table.toCollection()
      }
    } else {
      collection = this.table.toCollection()
    }
    
    // Apply soft delete filter
    if (this.softDelete) {
      collection = collection.and(item => !item.isDeleted)
    }
    
    // Apply having clause
    if (options?.having) {
      collection = collection.and(options.having)
    }
    
    // Apply ordering
    if (options?.orderBy) {
      const orderFields = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]
      collection = collection.sortBy(orderFields[0] as string)
    }
    
    // Apply pagination
    if (options?.offset) {
      collection = collection.offset(options.offset)
    }
    
    if (options?.limit) {
      collection = collection.limit(options.limit)
    }
    
    // Execute query
    let results = await collection.toArray()
    
    // Apply distinct
    if (options?.distinct) {
      const seen = new Set()
      results = results.filter(item => {
        const key = JSON.stringify(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    
    // Apply projection
    if (options?.select) {
      results = results.map(item => {
        const projected: any = { id: item.id }
        for (const field of options.select!) {
          projected[field as string] = item[field]
        }
        return projected as T
      })
    }
    
    // Load relationships
    if (options?.include) {
      results = await Promise.all(
        results.map(item => this.loadRelationships(item, options.include!))
      )
    }
    
    // Apply caching
    if (options?.cache) {
      const cacheKey = this.generateCacheKey(options)
      return databaseManager.queryCached(
        () => Promise.resolve(results),
        cacheKey,
        options.cacheTTL
      )
    }
    
    return results
  }
  
  /**
   * Find with pagination
   */
  async findPaginated(
    options: PaginationOptions,
    queryOptions?: QueryOptions<T>
  ): Promise<PaginatedResult<T>> {
    const total = await this.count(queryOptions?.where)
    const totalPages = Math.ceil(total / options.pageSize)
    
    const offset = (options.page - 1) * options.pageSize
    const data = await this.findAll({
      ...queryOptions,
      limit: options.pageSize,
      offset
    })
    
    return {
      data,
      total,
      page: options.page,
      pageSize: options.pageSize,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrevious: options.page > 1,
      cursor: options.cursor
    }
  }
  
  /**
   * Create with validation and audit
   */
  async create(data: Omit<T, keyof BaseEntity>, userId?: string): Promise<T> {
    // Validate data
    const validation = await this.validate(data)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    // Add audit info
    const entity: T = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      createdBy: userId,
      version: 1,
      isDeleted: false
    } as T
    
    // Use transaction for atomicity
    return databaseManager.executeTransaction(async (tx) => {
      await tx.table(this.tableName).add(entity)
      
      // Log audit trail
      await this.logAudit('create', entity.id, userId, { created: entity })
      
      return entity
    })
  }
  
  /**
   * Update with optimistic locking
   */
  async update(
    id: string,
    data: Partial<T>,
    userId?: string,
    expectedVersion?: number
  ): Promise<T> {
    return databaseManager.executeTransaction(async (tx) => {
      const existing = await tx.table(this.tableName).get(id) as T
      
      if (!existing) {
        throw new Error('Record not found')
      }
      
      if (this.softDelete && existing.isDeleted) {
        throw new Error('Cannot update deleted record')
      }
      
      // Check optimistic lock
      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        throw new Error('Record has been modified by another user')
      }
      
      // Validate changes
      const updated = { ...existing, ...data }
      const validation = await this.validate(updated)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }
      
      // Update with audit info
      const entity: T = {
        ...updated,
        updatedAt: new Date(),
        updatedBy: userId,
        version: existing.version + 1
      }
      
      await tx.table(this.tableName).put(entity)
      
      // Log audit trail
      await this.logAudit('update', id, userId, {
        before: existing,
        after: entity,
        changes: data
      })
      
      return entity
    })
  }
  
  /**
   * Delete with soft delete support
   */
  async delete(id: string, userId?: string, force: boolean = false): Promise<void> {
    return databaseManager.executeTransaction(async (tx) => {
      const existing = await tx.table(this.tableName).get(id) as T
      
      if (!existing) {
        throw new Error('Record not found')
      }
      
      if (this.softDelete && !force) {
        // Soft delete
        const entity: T = {
          ...existing,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          version: existing.version + 1
        }
        
        await tx.table(this.tableName).put(entity)
        
        // Log audit trail
        await this.logAudit('soft-delete', id, userId, { deleted: entity })
      } else {
        // Hard delete
        await tx.table(this.tableName).delete(id)
        
        // Log audit trail
        await this.logAudit('hard-delete', id, userId, { deleted: existing })
      }
    })
  }
  
  /**
   * Restore soft deleted record
   */
  async restore(id: string, userId?: string): Promise<T> {
    if (!this.softDelete) {
      throw new Error('Soft delete not enabled for this repository')
    }
    
    return databaseManager.executeTransaction(async (tx) => {
      const existing = await tx.table(this.tableName).get(id) as T
      
      if (!existing) {
        throw new Error('Record not found')
      }
      
      if (!existing.isDeleted) {
        throw new Error('Record is not deleted')
      }
      
      const entity: T = {
        ...existing,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: new Date(),
        updatedBy: userId,
        version: existing.version + 1
      }
      
      await tx.table(this.tableName).put(entity)
      
      // Log audit trail
      await this.logAudit('restore', id, userId, { restored: entity })
      
      return entity
    })
  }
  
  /**
   * Batch create with progress tracking
   */
  async batchCreate(
    items: Array<Omit<T, keyof BaseEntity>>,
    userId?: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<T[]> {
    const entities: T[] = []
    const batchSize = 100
    const total = items.length
    
    for (let i = 0; i < total; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, total))
      
      const batchEntities = await databaseManager.executeTransaction(async (tx) => {
        const created: T[] = []
        
        for (const item of batch) {
          const entity: T = {
            ...item,
            id: uuidv4(),
            createdAt: new Date(),
            createdBy: userId,
            version: 1,
            isDeleted: false
          } as T
          
          await tx.table(this.tableName).add(entity)
          created.push(entity)
        }
        
        return created
      })
      
      entities.push(...batchEntities)
      onProgress?.(entities.length, total)
    }
    
    return entities
  }
  
  /**
   * Count records
   */
  async count(where?: Partial<T>): Promise<number> {
    let collection = this.table.toCollection()
    
    if (this.softDelete) {
      collection = collection.and(item => !item.isDeleted)
    }
    
    if (where) {
      for (const [field, value] of Object.entries(where)) {
        collection = collection.and(item => (item as any)[field] === value)
      }
    }
    
    return collection.count()
  }
  
  /**
   * Check if exists
   */
  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }
  
  /**
   * Find or create
   */
  async findOrCreate(
    where: Partial<T>,
    defaults: Omit<T, keyof BaseEntity>,
    userId?: string
  ): Promise<[T, boolean]> {
    const existing = await this.findOne(where)
    
    if (existing) {
      return [existing, false]
    }
    
    const created = await this.create({ ...defaults, ...where } as any, userId)
    return [created, true]
  }
  
  /**
   * Find one record
   */
  async findOne(where: Partial<T>): Promise<T | null> {
    const results = await this.findAll({ where, limit: 1 })
    return results[0] || null
  }
  
  /**
   * Aggregate functions
   */
  async aggregate<R>(
    aggregation: {
      groupBy?: Array<keyof T>
      count?: boolean
      sum?: Array<keyof T>
      avg?: Array<keyof T>
      min?: Array<keyof T>
      max?: Array<keyof T>
    }
  ): Promise<R[]> {
    const data = await this.findAll()
    const groups = new Map<string, any[]>()
    
    // Group data
    if (aggregation.groupBy) {
      for (const item of data) {
        const key = aggregation.groupBy
          .map(field => item[field])
          .join('-')
        
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(item)
      }
    } else {
      groups.set('all', data)
    }
    
    // Calculate aggregations
    const results: R[] = []
    
    for (const [key, items] of groups) {
      const result: any = {}
      
      if (aggregation.groupBy) {
        for (const field of aggregation.groupBy) {
          result[field as string] = items[0][field]
        }
      }
      
      if (aggregation.count) {
        result.count = items.length
      }
      
      if (aggregation.sum) {
        for (const field of aggregation.sum) {
          result[`sum_${String(field)}`] = items.reduce(
            (sum, item) => sum + (item[field] as any || 0),
            0
          )
        }
      }
      
      if (aggregation.avg) {
        for (const field of aggregation.avg) {
          const sum = items.reduce(
            (total, item) => total + (item[field] as any || 0),
            0
          )
          result[`avg_${String(field)}`] = sum / items.length
        }
      }
      
      if (aggregation.min) {
        for (const field of aggregation.min) {
          result[`min_${String(field)}`] = Math.min(
            ...items.map(item => item[field] as any || 0)
          )
        }
      }
      
      if (aggregation.max) {
        for (const field of aggregation.max) {
          result[`max_${String(field)}`] = Math.max(
            ...items.map(item => item[field] as any || 0)
          )
        }
      }
      
      results.push(result)
    }
    
    return results
  }
  
  /**
   * Load relationships
   */
  protected async loadRelationships(entity: T, include: string[]): Promise<T> {
    const loaded: any = { ...entity }
    
    for (const rel of include) {
      const config = this.relationships.get(rel)
      if (!config) continue
      
      switch (config.type) {
        case 'hasOne':
          loaded[rel] = await this.loadHasOne(entity, config)
          break
        case 'hasMany':
          loaded[rel] = await this.loadHasMany(entity, config)
          break
        case 'belongsTo':
          loaded[rel] = await this.loadBelongsTo(entity, config)
          break
        case 'belongsToMany':
          loaded[rel] = await this.loadBelongsToMany(entity, config)
          break
      }
    }
    
    return loaded
  }
  
  /**
   * Load hasOne relationship
   */
  protected async loadHasOne(entity: T, config: RelationshipConfig): Promise<any> {
    const relatedTable = db.table(config.relatedTable)
    return relatedTable
      .where(config.foreignKey!)
      .equals((entity as any)[config.localKey || 'id'])
      .first()
  }
  
  /**
   * Load hasMany relationship
   */
  protected async loadHasMany(entity: T, config: RelationshipConfig): Promise<any[]> {
    const relatedTable = db.table(config.relatedTable)
    return relatedTable
      .where(config.foreignKey!)
      .equals((entity as any)[config.localKey || 'id'])
      .toArray()
  }
  
  /**
   * Load belongsTo relationship
   */
  protected async loadBelongsTo(entity: T, config: RelationshipConfig): Promise<any> {
    const relatedTable = db.table(config.relatedTable)
    return relatedTable.get((entity as any)[config.foreignKey!])
  }
  
  /**
   * Load belongsToMany relationship
   */
  protected async loadBelongsToMany(entity: T, config: RelationshipConfig): Promise<any[]> {
    const pivotTable = db.table(config.pivotTable!)
    const relatedTable = db.table(config.relatedTable)
    
    const pivotRecords = await pivotTable
      .where(config.pivotLocalKey!)
      .equals(entity.id)
      .toArray()
    
    const relatedIds = pivotRecords.map(p => (p as any)[config.pivotForeignKey!])
    
    return relatedTable
      .where('id')
      .anyOf(relatedIds)
      .toArray()
  }
  
  /**
   * Validate entity
   */
  protected async validate(data: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    for (const [field, rules] of this.validationRules) {
      const value = data[field]
      
      for (const rule of rules) {
        if (!rule.validate(value, data)) {
          errors.push(rule.message || `Validation failed for ${field}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Generate cache key
   */
  protected generateCacheKey(options: QueryOptions<T>): string {
    return `${this.tableName}:${JSON.stringify(options)}`
  }
  
  /**
   * Log audit trail
   */
  protected async logAudit(
    action: string,
    recordId: string,
    userId?: string,
    data?: any
  ): Promise<void> {
    // Store audit log in a separate table or service
    const auditLog = {
      id: uuidv4(),
      tableName: this.tableName,
      action,
      recordId,
      userId,
      timestamp: new Date(),
      data: JSON.stringify(data)
    }
    
    // Store in audit table if it exists
    const auditTable = db.table('auditLogs')
    if (auditTable) {
      await auditTable.add(auditLog)
    }
  }
}

// Relationship configuration
interface RelationshipConfig {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  relatedTable: string
  foreignKey?: string
  localKey?: string
  pivotTable?: string
  pivotLocalKey?: string
  pivotForeignKey?: string
}

// Export validation helpers
export const ValidationRules = {
  required: (message?: string) => ({
    validate: (value: any) => value !== undefined && value !== null && value !== '',
    message: message || 'Field is required'
  }),
  
  min: (min: number, message?: string) => ({
    validate: (value: any) => {
      if (typeof value === 'number') return value >= min
      if (typeof value === 'string') return value.length >= min
      if (Array.isArray(value)) return value.length >= min
      return false
    },
    message: message || `Minimum value is ${min}`
  }),
  
  max: (max: number, message?: string) => ({
    validate: (value: any) => {
      if (typeof value === 'number') return value <= max
      if (typeof value === 'string') return value.length <= max
      if (Array.isArray(value)) return value.length <= max
      return false
    },
    message: message || `Maximum value is ${max}`
  }),
  
  pattern: (pattern: RegExp, message?: string) => ({
    validate: (value: any) => {
      if (typeof value !== 'string') return false
      return pattern.test(value)
    },
    message: message || 'Invalid format'
  }),
  
  email: (message?: string) => ({
    validate: (value: any) => {
      if (typeof value !== 'string') return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    message: message || 'Invalid email address'
  }),
  
  url: (message?: string) => ({
    validate: (value: any) => {
      if (typeof value !== 'string') return false
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message: message || 'Invalid URL'
  }),
  
  custom: (validator: (value: any, data: any) => boolean, message?: string) => ({
    validate: validator,
    message: message || 'Validation failed'
  })
}