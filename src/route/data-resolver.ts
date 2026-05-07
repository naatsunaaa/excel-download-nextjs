export function resolvePath(obj: unknown, path: string): unknown[] {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return []
    current = (current as Record<string, unknown>)[key]
  }
  return Array.isArray(current) ? current : current != null ? [current] : []
}

export function resolveAllPaths(obj: unknown, paths: string[]): unknown[] {
  return paths.flatMap((path) => resolvePath(obj, path))
}
