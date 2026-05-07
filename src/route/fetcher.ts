import type { RouteConfig } from '../shared/types'

export async function resolveHeaders(
  config: RouteConfig,
  req: Request
): Promise<Record<string, string>> {
  if (config.getHeaders) {
    return await config.getHeaders(req)
  }
  if (config.headers) {
    return { ...config.headers }
  }
  return {}
}

interface FetchParams {
  url: string
  method: string
  headers: Record<string, string>
  params?: Record<string, unknown>
  body?: unknown
}

export async function fetchApi(
  config: RouteConfig,
  { url, method, headers, params, body }: FetchParams
): Promise<unknown> {
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '')
  const fullPath = url.startsWith('/') ? url : `/${url}`
  let fullUrl = `${baseUrl}${fullPath}`

  if (params && (method === 'GET' || method === 'DELETE')) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    if (qs) fullUrl += `?${qs}`
  }

  if (config.fetcher && typeof config.fetcher === 'object' && 'request' in config.fetcher) {
    const axiosInstance = config.fetcher as {
      request: (config: Record<string, unknown>) => Promise<{ data: unknown }>
    }
    const response = await axiosInstance.request({
      url: fullUrl,
      method,
      headers,
      data: method !== 'GET' && method !== 'DELETE' ? body : undefined,
      params: method === 'GET' || method === 'DELETE' ? params : undefined,
    })
    return response.data
  }

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const fetchOptions: RequestInit = {
    method,
    headers: fetchHeaders,
  }

  if (method !== 'GET' && method !== 'DELETE' && body != null) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(fullUrl, fetchOptions)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
