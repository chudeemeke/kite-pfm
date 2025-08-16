/**
 * Data Provider Interface
 * Defines the contract for any storage implementation
 * This allows us to swap storage engines without changing any application code
 */

export interface IDataProvider {
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Transaction support
  beginTransaction(): Promise<ITransaction>
  
  // Generic CRUD operations
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<T>
  read<T>(collection: string, id: string): Promise<T | null>
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>
  delete(collection: string, id: string): Promise<void>
  
  // Query operations
  query<T>(collection: string, query: IQuery): Promise<T[]>
  count(collection: string, query: IQuery): Promise<number>
  exists(collection: string, query: IQuery): Promise<boolean>
  
  // Bulk operations
  bulkCreate<T>(collection: string, data: Array<Omit<T, 'id'>>): Promise<T[]>
  bulkUpdate<T>(collection: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]>
  bulkDelete(collection: string, ids: string[]): Promise<void>
  
  // Schema management
  createCollection(name: string, schema?: ICollectionSchema): Promise<void>
  dropCollection(name: string): Promise<void>
  collectionExists(name: string): Promise<boolean>
  
  // Indexing
  createIndex(collection: string, index: IIndex): Promise<void>
  dropIndex(collection: string, indexName: string): Promise<void>
  
  // Backup and restore
  backup(): Promise<Blob>
  restore(data: Blob): Promise<void>
  
  // Maintenance
  vacuum(): Promise<void>
  analyze(): Promise<void>
  getStatistics(): Promise<IProviderStatistics>
}

export interface ITransaction {
  id: string
  status: 'pending' | 'committed' | 'rolled_back'
  
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<T>
  read<T>(collection: string, id: string): Promise<T | null>
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>
  delete(collection: string, id: string): Promise<void>
  query<T>(collection: string, query: IQuery): Promise<T[]>
  
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface IQuery {
  // Filtering
  where?: IWhereClause[]
  
  // Sorting
  orderBy?: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  
  // Pagination
  limit?: number
  offset?: number
  cursor?: string
  
  // Projection
  select?: string[]
  exclude?: string[]
  
  // Relationships
  include?: Array<{
    relation: string
    query?: IQuery
  }>
  
  // Grouping
  groupBy?: string[]
  having?: IWhereClause[]
  
  // Aggregations
  aggregate?: {
    count?: boolean
    sum?: string[]
    avg?: string[]
    min?: string[]
    max?: string[]
  }
  
  // Options
  distinct?: boolean
  cache?: {
    enabled: boolean
    ttl?: number
    key?: string
  }
}

export interface IWhereClause {
  field: string
  operator: WhereOperator
  value: any
  or?: IWhereClause[]
  and?: IWhereClause[]
}

export type WhereOperator = 
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'like'    // pattern match
  | 'nlike'   // not pattern match
  | 'between' // between two values
  | 'exists'  // field exists
  | 'nexists' // field not exists
  | 'array_contains' // array contains value
  | 'array_contains_any' // array contains any of values
  | 'array_contains_all' // array contains all values

export interface ICollectionSchema {
  fields: IFieldDefinition[]
  indexes?: IIndex[]
  constraints?: IConstraint[]
  options?: {
    timestamps?: boolean
    softDelete?: boolean
    versioning?: boolean
    encryption?: string[]
  }
}

export interface IFieldDefinition {
  name: string
  type: FieldType
  required?: boolean
  unique?: boolean
  default?: any
  validate?: (value: any) => boolean | string
  transform?: (value: any) => any
  encrypted?: boolean
}

export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'binary'
  | 'uuid'
  | 'json'

export interface IIndex {
  name: string
  fields: Array<{
    field: string
    order?: 'asc' | 'desc'
  }>
  unique?: boolean
  sparse?: boolean
  partial?: IWhereClause
}

export interface IConstraint {
  type: 'unique' | 'foreign_key' | 'check'
  name: string
  fields?: string[]
  references?: {
    collection: string
    field: string
    onDelete?: 'cascade' | 'restrict' | 'set_null'
    onUpdate?: 'cascade' | 'restrict'
  }
  check?: (record: any) => boolean
}

export interface IProviderStatistics {
  collections: Array<{
    name: string
    count: number
    size: number
    indexes: number
  }>
  totalSize: number
  totalRecords: number
  performance: {
    averageQueryTime: number
    slowQueries: Array<{
      query: string
      duration: number
      timestamp: Date
    }>
    cacheHitRate: number
  }
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    recommendations: string[]
  }
}

// Event emitter for real-time updates
export interface IDataProviderEvents {
  'record:created': (collection: string, record: any) => void
  'record:updated': (collection: string, record: any, changes: any) => void
  'record:deleted': (collection: string, id: string) => void
  'collection:created': (name: string) => void
  'collection:dropped': (name: string) => void
  'transaction:committed': (id: string) => void
  'transaction:rolled_back': (id: string) => void
  'error': (error: Error) => void
  'performance:slow_query': (query: any, duration: number) => void
}

// Query builder interface for fluent API
export interface IQueryBuilder<T> {
  where(field: string, operator: WhereOperator, value: any): IQueryBuilder<T>
  whereIn(field: string, values: any[]): IQueryBuilder<T>
  whereBetween(field: string, min: any, max: any): IQueryBuilder<T>
  whereNull(field: string): IQueryBuilder<T>
  whereNotNull(field: string): IQueryBuilder<T>
  
  orWhere(field: string, operator: WhereOperator, value: any): IQueryBuilder<T>
  
  orderBy(field: string, direction?: 'asc' | 'desc'): IQueryBuilder<T>
  
  limit(count: number): IQueryBuilder<T>
  offset(count: number): IQueryBuilder<T>
  
  select(...fields: string[]): IQueryBuilder<T>
  exclude(...fields: string[]): IQueryBuilder<T>
  
  include(relation: string, query?: (builder: IQueryBuilder<any>) => void): IQueryBuilder<T>
  
  groupBy(...fields: string[]): IQueryBuilder<T>
  having(field: string, operator: WhereOperator, value: any): IQueryBuilder<T>
  
  distinct(): IQueryBuilder<T>
  
  cache(ttl?: number, key?: string): IQueryBuilder<T>
  
  // Execution methods
  get(): Promise<T[]>
  first(): Promise<T | null>
  count(): Promise<number>
  exists(): Promise<boolean>
  paginate(page: number, perPage: number): Promise<IPaginatedResult<T>>
  chunk(size: number, callback: (chunk: T[]) => Promise<void>): Promise<void>
  cursor(): AsyncIterableIterator<T>
  
  // Aggregations
  sum(field: string): Promise<number>
  avg(field: string): Promise<number>
  min(field: string): Promise<any>
  max(field: string): Promise<any>
  
  // Mutations
  update(data: Partial<T>): Promise<number>
  delete(): Promise<number>
  
  // Raw query escape hatch
  raw(query: string, params?: any[]): Promise<any>
  
  // Explain query plan
  explain(): Promise<IQueryPlan>
}

export interface IPaginatedResult<T> {
  data: T[]
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  hasMorePages: boolean
  isEmpty: boolean
}

export interface IQueryPlan {
  query: IQuery
  estimatedCost: number
  indexesUsed: string[]
  scanType: 'index' | 'full' | 'range'
  estimatedRows: number
  warnings: string[]
  suggestions: string[]
}