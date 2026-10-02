// Small helpers shared by the templates and the build.

/** Escape text for HTML text nodes and attribute values. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Decode the few entities Google Play text can carry, then escape for HTML. */
export function playText(s) {
  const decoded = String(s ?? '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return esc(decoded);
}

/** Play image URLs take a size suffix after "=". */
export function playImg(url, size) {
  return url ? url.split('=')[0] + '=' + size : '';
}

/** "1,000,000+" -> 1000000 ; "0+" -> 0 */
export function installsNumber(s) {
  const n = parseInt(String(s || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** 9100000 -> "9.1M", 117238 -> "117K" */
export function compact(n) {
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toString().replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.floor(n / 1e3) + 'K';
  return String(n);
}

export const MIN_RATING = 3.5;
