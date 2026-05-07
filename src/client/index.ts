import type { ClientConfig, DownloadRequest } from '../shared/types'

export function createExcelDownloader(config: ClientConfig) {
  return async function downloadExcel(request: DownloadRequest): Promise<void> {
    const format = request.format ?? config.format ?? 'xlsx'
    const payload = { ...request, format }

    try {
      const response = await fetch(config.routePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          (error as { error?: string }).error || `Excel download failed: ${response.status}`
        )
      }

      const blob = await response.blob()
      const extension = format === 'csv' ? 'csv' : 'xlsx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${request.filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (config.onError) {
        config.onError(err)
      } else {
        throw err
      }
    }
  }
}

export type {
  ClientConfig,
  DownloadRequest,
  Sheet,
  SourceSheet,
  MergeSheet,
  Source,
  SourceColumn,
  MergeColumn,
  ColumnStyle,
} from '../shared/types'
