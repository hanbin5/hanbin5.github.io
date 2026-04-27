/**
 * normalize-image-urls.mjs
 * ---------------------------------------------------------------------
 * Pre-parse pass that percent-encodes unsafe characters inside the URL
 * portion of `![alt](url)` markdown image syntax.
 *
 * Why a string-level pass instead of a remark AST plugin?
 *   CommonMark's link/image parser refuses to recognise a destination
 *   that contains a raw space (the space is treated as the end of the
 *   URL and the parser then expects an optional title). Anything Obsidian
 *   pastes from `_Attachments/Pasted image 20260427112217.png` therefore
 *   never reaches the AST as an `image` node — it's silently demoted to
 *   plain text and shows up on the page as `![…](…)`. By the time a
 *   remark plugin runs, the image node is already gone, so the only
 *   place we can intervene is BEFORE the parser sees the markdown.
 *
 * Scope:
 *   - Only the URL between `(` and `)` (or before an optional `"title"`)
 *     is touched. The `alt` text and any surrounding markdown is
 *     untouched.
 *   - URLs already wrapped in `<…>` are left alone — the angle-bracket
 *     form is the spec-blessed way to allow spaces and we don't want to
 *     double-encode someone's deliberate choice.
 *   - URLs that already contain a `%` followed by two hex digits at the
 *     position we'd otherwise encode are also left alone, so running
 *     this pass twice on the same file is a no-op.
 *
 * Idempotence test: every well-formed image whose URL contains only
 * url-safe characters is left byte-identical. Re-encoding `Pasted%20image`
 * does not produce `Pasted%2520image`.
 */

// Characters that are valid inside a CommonMark URL destination without
// being wrapped in <…>. Source: RFC 3986 unreserved + sub-delims, plus
// the path/query/fragment delimiters we want to preserve. We intentionally
// keep `%` so already-encoded triplets are left as-is.
const URL_SAFE = /[A-Za-z0-9\-._~!$&'()*+,;=:@/?#%]/;

function encodeChar(ch) {
  // encodeURIComponent handles multi-byte (e.g. Korean) correctly;
  // single-byte ASCII like " " becomes "%20".
  return encodeURIComponent(ch);
}

function encodeUrl(url) {
  if (!url) return url;
  // Angle-bracket form: leave the contents alone.
  if (url.startsWith("<") && url.endsWith(">")) return url;

  let out = "";
  for (let i = 0; i < url.length; i++) {
    const ch = url[i];
    if (URL_SAFE.test(ch)) {
      out += ch;
      continue;
    }
    out += encodeChar(ch);
  }
  return out;
}

// Match `![alt](dest [optional "title"])`. The dest stops at the first
// unescaped whitespace OR closing `)` OR start of a `"…"` title. We
// keep the regex deliberately conservative so we don't trip on nested
// parens, but a single level of balanced parens inside dest is allowed.
//
// Capture groups:
//   1: alt
//   2: dest
//   3: optional title segment including the leading whitespace and quotes
const IMAGE_RE = /!\[([^\]]*)\]\(([^)]*?)(\s+"[^"]*")?\)/g;

export function fixImageUrls(input) {
  return input.replace(IMAGE_RE, (match, alt, dest, title = "") => {
    const encoded = encodeUrl(dest);
    if (encoded === dest && title === "") return match; // nothing to do
    return `![${alt}](${encoded}${title})`;
  });
}
