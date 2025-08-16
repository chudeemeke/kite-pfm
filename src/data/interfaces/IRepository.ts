/**
 * Repository Interface
 * Defines the contract for all repository implementations
 * This abstraction allows for complete separation between business logic and data access
 */

import { IQueryBuilder, IPaginatedResult, IWhereClause } from './IDataProvider'

/**
 * Base entity interface that all domain models should extend
 */
export interface IEntity {
  id: string
  createdAt?: Date
  updatedAt?: Date
  version?: number
}

/**
 * Soft deletable entity
 */
export interface ISoftDeletable {
  isDeleted?: boolean
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Repository options for operations
 */
export interface IRepositoryOptions {
  // Transaction support
  transaction?: IRepositoryTransaction
  
  // User context for audit
  userId?: string
  
  // Bypass validation
  skipValidation?: boolean
  
  // Bypass hooks
  skipHooks?: boolean
  
  // Lock for update
  lock?: boolean
  
  // Timeout in milliseconds
  timeout?: number
}

/**
 * Repository transaction interface
 */
export interface IRepositoryTransaction {
  id: string
  commit(): Promise<void>
  rollback(): Promise<void>
}

/**
 * Main repository interface
 */
export interface IRepository<T extends IEntity> {
  // Basic CRUD operations
  findById(id: string, options?: IFindOptions): Promise<T | null>
  findOne(conditions: Partial<T> | IWhereClause[], options?: IFindOptions): Promise<T | null>
  findAll(options?: IFindOptions): Promise<T[]>
  create(data: ICreateData<T>, options?: IRepositoryOptions): Promise<T>
  update(id: string, data: IUpdateData<T>, options?: IRepositoryOptions): Promise<T>
  delete(id: string, options?: IRepositoryOptions): Promise<void>
  
  // Bulk operations
  createMany(data: ICreateData<T>[], options?: IRepositoryOptions): Promise<T[]>
  updateMany(updates: Array<{ id: string; data: IUpdateData<T> }>, options?: IRepositoryOptions): Promise<T[]>
  deleteMany(ids: string[], options?: IRepositoryOptions): Promise<void>
  
  // Query builder
  query(): IQueryBuilder<T>
  
  // Pagination
  paginate(page: number, perPage: number, options?: IFindOptions): Promise<IPaginatedResult<T>>
  
  // Existence checks
  exists(conditions: Partial<T> | IWhereClause[]): Promise<boolean>
  count(conditions?: Partial<T> | IWhereClause[]): Promise<number>
  
  // Aggregations
  sum(field: keyof T, conditions?: Partial<T> | IWhereClause[]): Promise<number>
  avg(field: keyof T, conditions?: Partial<T> | IWhereClause[]): Promise<number>
  min(field: keyof T, conditions?: Partial<T> | IWhereClause[]): Promise<any>
  max(field: keyof T, conditions?: Partial<T> | IWhereClause[]): Promise<any>
  
  // Transactions
  beginTransaction(): Promise<IRepositoryTransaction>
  
  // Hooks
  beforeCreate(handler: IHookHandler<T>): void
  afterCreate(handler: IHookHandler<T>): void
  beforeUpdate(handler: IHookHandler<T>): void
  afterUpdate(handler: IHookHandler<T>): void
  beforeDelete(handler: IHookHandler<T>): void
  afterDelete(handler: IHookHandler<T>): void
  
  // Validation
  validate(data: Partial<T>): Promise<IValidationResult>
  
  // Events
  on(event: RepositoryEvent, handler: (data: any) => void): void
  off(event: RepositoryEvent, handler: (data: any) => void): void
  
  // Utilities
  truncate(): Promise<void>
  refresh(entity: T): Promise<T>
  clone(entity: T): T
}

/**
 * Soft deletable repository interface
 */
export interface ISoftDeletableRepository<T extends IEntity & ISoftDeletable> extends IRepository<T> {
  // Soft delete specific methods
  softDelete(id: string, options?: IRepositoryOptions): Promise<void>
  restore(id: string, options?: IRepositoryOptions): Promise<T>
  findDeleted(options?: IFindOptions): Promise<T[]>
  findWithDeleted(options?: IFindOptions): Promise<T[]>
  permanentlyDelete(id: string, options?: IRepositoryOptions): Promise<void>
}

/**
 * Find options for queries
 */
export interface IFindOptions {
  // Filtering
  where?: Partial<T> | IWhereClause[]
  
  // Sorting
  orderBy?: string | string[] | Array<{ field: string; direction: 'asc' | 'desc' }>
  
  // Pagination
  limit?: number
  offset?: number
  
  // Relations
  include?: string[] | IIncludeOption[]
  
  // Projection
  select?: Array<keyof T>
  exclude?: Array<keyof T>
  
  // Caching
  cache?: boolean | { ttl: number; key?: string }
  
  // Other options
  distinct?: boolean
  lock?: boolean
  raw?: boolean
}

/**
 * Include option for eager loading
 */
export interface IIncludeOption {
  relation: string
  select?: string[]
  where?: IWhereClause[]
  orderBy?: string | Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
}

/**
 * Create data type (omit system fields)
 */
export type ICreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>

/**
 * Update data type (partial, omit system fields)
 */
export type IUpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>>

/**
 * Hook handler type
 */
export type IHookHandler<T> = (
  data: T,
  options: IRepositoryOptions
) => Promise<void> | void

/**
 * Repository events
 */
export type RepositoryEvent = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'softDeleted'
  | 'restored'
  | 'truncated'
  | 'error'

/**
 * Validation result
 */
export interface IValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
  warnings?: Array<{
    field: string
    message: string
  }>
}

/**
 * Repository factory interface
 */
export interface IRepositoryFactory {
  create<T extends IEntity>(
    entityName: string,
    schema?: IEntitySchema<T>
  ): IRepository<T>
  
  createSoftDeletable<T extends IEntity & ISoftDeletable>(
    entityName: string,
    schema?: IEntitySchema<T>
  ): ISoftDeletableRepository<T>
}

/**
 * Entity schema definition
 */
export interface IEntitySchema<T> {
  tableName?: string
  fields: IFieldSchema<T>[]
  indexes?: IIndexSchema[]
  relations?: IRelationSchema[]
  validations?: IValidationSchema<T>[]
  hooks?: IHookSchema<T>[]
  options?: {
    timestamps?: boolean
    softDelete?: boolean
    versioning?: boolean
    audit?: boolean
  }
}

/**
 * Field schema
 */
export interface IFieldSchema<T> {
  name: keyof T
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required?: boolean
  unique?: boolean
  indexed?: boolean
  default?: any
  encrypted?: boolean
}

/**
 * Index schema
 */
export interface IIndexSchema {
  name: string
  fields: string[]
  unique?: boolean
  sparse?: boolean
}

/**
 * Relation schema
 */
export interface IRelationSchema {
  name: string
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  target: string
  foreignKey?: string
  localKey?: string
  through?: string
  cascade?: boolean
}

/**
 * Validation schema
 */
export interface IValidationSchema<T> {
  field: keyof T
  rules: IValidationRule[]
}

/**
 * Validation rule
 */
export interface IValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom'
  value?: any
  message?: string
  validator?: (value: any, entity: any) => boolean | Promise<boolean>
}

/**
 * Hook schema
 */
export interface IHookSchema<T> {
  event: 'beforeCreate' | 'afterCreate' | 'beforeUpdate' | 'afterUpdate' | 'beforeDelete' | 'afterDelete'
  handler: IHookHandler<T>
}

/**
 * Unit of Work interface for managing multiple repository operations
 */
export interface IUnitOfWork {
  // Repository access
  getRepository<T extends IEntity>(entityName: string): IRepository<T>
  
  // Transaction management
  beginTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  
  // State tracking
  isDirty(): boolean
  getChanges(): IChangeSet[]
  
  // Save all changes
  saveChanges(): Promise<void>
}

/**
 * Change tracking
 */
export interface IChangeSet {
  entity: string
  id: string
  operation: 'create' | 'update' | 'delete'
  original?: any
  current?: any
  changes?: any
}