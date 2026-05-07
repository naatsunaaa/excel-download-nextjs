import type {
  RouteConfig,
  DownloadRequest,
  Sheet,
  SourceSheet,
  MergeSheet,
  SheetData,
  BlockData,
  SourceColumn,
} from '../shared/types'
import { resolveHeaders, fetchApi } from './fetcher'
import { resolveAllPaths } from './data-resolver'
import { buildExcelWorkbook } from './excel-builder'
import { buildCsv } from './csv-builder'

function isMergeSheet(sheet: Sheet): sheet is MergeSheet {
  return 'merge' in sheet
}

async function processSourceSheet(
  sheet: SourceSheet,
  config: RouteConfig,
  headers: Record<string, string>
): Promise<SheetData> {
  const data = await fetchApi(config, {
    url: sheet.endpoint,
    method: sheet.method || 'GET',
    headers,
    params: sheet.params,
    body: sheet.body,
  })

  const blocks: BlockData[] = sheet.sources.map((source) => {
    const rows = resolveAllPaths(data, source.dataPath) as Record<string, unknown>[]
    return { columns: source.columns, rows }
  })

  return { name: sheet.name, blocks }
}

async function processMergeSheet(
  sheet: MergeSheet,
  config: RouteConfig,
  headers: Record<string, string>
): Promise<SheetData> {
  const { endpoints, columns } = sheet.merge

  const responses = await Promise.all(
    endpoints.map((ep) =>
      fetchApi(config, {
        url: ep.url,
        method: ep.method,
        headers,
        params: ep.params,
        body: ep.body,
      })
    )
  )

  const allRows: Record<string, unknown>[] = []

  for (let epIdx = 0; epIdx < endpoints.length; epIdx++) {
    const ep = endpoints[epIdx]
    const data = responses[epIdx]
    const rows = resolveAllPaths(data, ep.dataPath) as Record<string, unknown>[]

    for (const row of rows) {
      const mappedRow: Record<string, unknown> = {}
      for (const col of columns) {
        const keyForThisEndpoint = col.key[epIdx]
        if (keyForThisEndpoint && row[keyForThisEndpoint] != null) {
          mappedRow[col.label] = row[keyForThisEndpoint]
        }
      }
      allRows.push(mappedRow)
    }
  }

  const mergedColumns: SourceColumn[] = columns.map((col) => ({
    key: col.label,
    label: col.label,
    style: col.style,
  }))

  return { name: sheet.name, blocks: [{ columns: mergedColumns, rows: allRows }] }
}

export function createExcelRoute(config: RouteConfig) {
  return async function POST(req: Request): Promise<Response> {
    try {
      const body: DownloadRequest = await req.json()
      const { sheets, filename, format = 'xlsx' } = body

      const headers = await resolveHeaders(config, req)

      const sheetDataList = await Promise.all(
        sheets.map((sheet) => {
          if (isMergeSheet(sheet)) {
            return processMergeSheet(sheet, config, headers)
          }
          return processSourceSheet(sheet, config, headers)
        })
      )

      if (format === 'csv') {
        const csvBuffer = buildCsv(sheetDataList)
        return new Response(new Uint8Array(csvBuffer), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.csv`,
          },
        })
      }

      const buffer = await buildExcelWorkbook(sheetDataList, config.defaultStyles)
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx`,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}

export type {
  RouteConfig,
  DefaultStyles,
  DownloadRequest,
  Sheet,
  SourceSheet,
  MergeSheet,
  Source,
  SourceColumn,
  MergeColumn,
  MergeEndpoint,
  ColumnStyle,
} from '../shared/types'
