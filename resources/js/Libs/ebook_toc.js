export const resolveTocHref = (href, spineItems = []) => {
  if (!href || !Array.isArray(spineItems) || spineItems.length === 0)
    return href;

  const [rawPath, anchor] = href.split("#");
  const path = (rawPath ?? href)
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  const candidates = new Set([
    path,
    path.replace(/^Text\//, "OEBPS/Text/"),
    path.replace(/^OEBPS\//, ""),
    `OEBPS/${path}`,
  ]);

  let match = spineItems.find((item) => candidates.has(item.href));
  if (!match) {
    match = spineItems.find(
      (item) =>
        item.href &&
        (item.href.endsWith(`/${path}`) || path.endsWith(item.href)),
    );
  }

  const resolved = match?.href ?? path;
  return anchor ? `${resolved}#${anchor}` : resolved;
};

export const normalizeTocEntries = (entries, spineItems = []) => {
  if (!Array.isArray(entries)) return [];

  return entries.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };
    if (normalized.href) {
      normalized.href = resolveTocHref(normalized.href, spineItems);
    }
    if (Array.isArray(normalized.subitems)) {
      normalized.subitems = normalizeTocEntries(
        normalized.subitems,
        spineItems,
      );
    }
    if (Array.isArray(normalized.children)) {
      normalized.children = normalizeTocEntries(
        normalized.children,
        spineItems,
      );
    }
    return normalized;
  });
};
