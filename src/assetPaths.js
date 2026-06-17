export function resolveAssetPath(path) {
  if (!path) return path
  if (/^(?:[a-z]+:)?\/\//i.test(path)) return path

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  if (typeof document === 'undefined') {
    return `${normalizedBase}${normalizedPath}`
  }

  return new URL(`${normalizedBase}${normalizedPath}`, document.baseURI).href
}
