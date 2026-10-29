/**
 * Keeps drawing links presentation-friendly while the file-server integration
 * is still being wired. A network path is stored verbatim for auditability and
 * can be rendered as a best-effort file URI on managed company computers.
 */
export function isNetworkPath(value: string | null | undefined) {
  return Boolean(value && /^\\\\[^\\/]+[\\/]/.test(value.trim()));
}

/** Converts `\\\\server\\share\\file.pdf` into a standards-shaped file URI. */
export function networkPathToFileUrl(value: string) {
  const path = value.trim().replace(/^\\\\+/, "");
  const segments = path.split(/[\\/]+/).filter(Boolean);

  if (segments.length < 2) return null;

  return `file://${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

/**
 * Browser access to file:// is controlled by company browser policy. Returning
 * the URL here lets the UI offer an Open action while retaining Copy Path as a
 * reliable fallback.
 */
export function drawingHref(
  drawingLink: string | null | undefined,
  drawingNetworkPath?: string | null,
) {
  const candidate = drawingLink?.trim() || drawingNetworkPath?.trim() || "";

  if (!candidate) return null;
  if (isNetworkPath(candidate)) return networkPathToFileUrl(candidate);

  try {
    const url = new URL(candidate);
    return ["http:", "https:", "file:", "blob:"].includes(url.protocol)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function drawingDisplayName(
  fileName: string | null | undefined,
  drawingNetworkPath?: string | null,
) {
  if (fileName?.trim()) return fileName;
  if (drawingNetworkPath?.trim()) {
    return drawingNetworkPath.split(/[\\/]/).filter(Boolean).at(-1) ?? "Open Drawing";
  }
  return "Open Drawing";
}
