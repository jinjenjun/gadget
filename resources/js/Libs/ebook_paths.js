export const normalizeChunkPath = (url, baseUrl = '') => {
  if (!url) return '';
  const cleaned = url.split('#')[0].split('?')[0];
  if (cleaned.startsWith('blob:') || cleaned.startsWith('data:')) return '';
  try {
    const resolvedBase = baseUrl ? new URL(baseUrl, window.location.href).toString() : '';
    const parsed = new URL(cleaned, resolvedBase || window.location.href);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    return decodeURIComponent(cleaned.replace(/^\.?\//, '').replace(/^\/+/, ''));
  }
};

export const buildChunkPathCandidates = (path) => {
  const candidates = new Set([path]);
  try {
    candidates.add(decodeURIComponent(path));
  } catch {
    // ignore invalid sequences
  }
  const encoded = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  candidates.add(encoded);
  return candidates;
};

export const resolveChunkPathFromUrl = (url, manifestUrl) => {
  const normalized = normalizeChunkPath(url, manifestUrl || '');
  if (!normalized) return '';
  if (!manifestUrl) return normalized;
  const manifestPath = normalizeChunkPath(manifestUrl);
  if (!manifestPath) return normalized;
  const baseDir = manifestPath.endsWith('/') ? manifestPath : manifestPath.replace(/[^/]+$/, '');
  if (normalized.startsWith(baseDir)) {
    return normalized.slice(baseDir.length);
  }
  const normalizedBaseDir = baseDir.replace(/\/+$/, '');
  const lastSegment = normalizedBaseDir.split('/').pop();
  if (lastSegment && normalized.startsWith(`${lastSegment}/`)) {
    return normalized.slice(lastSegment.length + 1);
  }
  return normalized;
};

export const resolveResourceUrl = (url, baseUrl) => {
  try {
    return new URL(url, baseUrl || window.location.href).toString();
  } catch {
    return url;
  }
};

export const resolveDocumentBaseUrl = (doc, fallbackUrl) => {
  if (!doc) return fallbackUrl || '';
  const baseEl = doc.querySelector?.('base[href]');
  if (baseEl?.href) return baseEl.href;
  if (doc.baseURI && doc.baseURI !== 'about:srcdoc') return doc.baseURI;
  return fallbackUrl || '';
};
