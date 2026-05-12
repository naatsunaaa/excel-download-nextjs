export interface ColumnStyle {
  width?: number
  numFmt?: string
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
  }
  font?: {
    bold?: boolean
    color?: { argb: string }
    size?: number
  }
  fill?: {
    type: 'pattern'
    pattern: 'solid'
    fgColor: { argb: string }
  }
}

export interface SourceColumn {
  key: string
  label: string
  style?: ColumnStyle
  transform?: (value: unknown, row: Record<string, unknown>) => unknown
}

export interface MergeColumn {
  key: string[]
  label: string
  style?: ColumnStyle
  transform?: (value: unknown, row: Record<string, unknown>) => unknown
}

export interface Source {
  dataPath: string[]
  columns: SourceColumn[]
}

export interface MergeEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  dataPath: string[]
  params?: Record<string, unknown>
  body?: unknown
}

export interface SourceSheet {
  name: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, unknown>
  body?: unknown
  sources: Source[]
}

export interface MergeSheet {
  name: string
  merge: {
    endpoints: MergeEndpoint[]
    columns: MergeColumn[]
  }
}

export type Sheet = SourceSheet | MergeSheet

export interface DownloadRequest {
  sheets: Sheet[]
  filename: string
  format?: 'xlsx' | 'csv'
}

export interface DefaultStyles {
  headerFont?: ColumnStyle['font']
  headerFill?: ColumnStyle['fill']
  defaultWidth?: number
}

export interface RouteConfig {
  fetcher?: unknown
  headers?: Record<string, string>
  getHeaders?: (req: Request) => Record<string, string> | Promise<Record<string, string>>
  baseUrl?: string
  defaultStyles?: DefaultStyles
}

export interface ClientConfig {
  routePath: string
  format?: 'xlsx' | 'csv'
  onError?: (error: Error) => void
}

export interface SheetData {
  name: string
  blocks: BlockData[]
}

export interface BlockData {
  columns: SourceColumn[]
  rows: Record<string, unknown>[]
}
