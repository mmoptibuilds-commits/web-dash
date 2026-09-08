/**
 * Address parsing & normalization for the omnibox / shortcut URLs.
 *
 * Behaviour (V1):
 *  - an explicit http(s) URL is kept and normalized;
 *  - a bare host / domain / localhost / IPv4 (with optional path or port)
 *    is treated as a URL and prefixed with https://;
 *  - dangerous schemes (javascript:, data:, file:, vbscript:, etc.) are
 *    rejected outright;
 *  - anything else is a search query.
 */

export type AddressResult =
  | { kind: 'url'; url: string }
  | { kind: 'search'; query: string }
  | { kind: 'invalid'; reason: string }

const SAFE_SCHEMES = new Set(['http', 'https'])

/** Schemes we never navigate to from a shortcut/omnibox. */
const BLOCKED_SCHEMES =
  /^(javascript|data|file|vbscript|about|blob|chrome|chrome-extension|ms-appx|ms-appx-web|sms|tel):/i

const DOMAIN_RE = /^(?:[\w-]+\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/\S*)?$/
const LOCALHOST_RE = /^localhost(?::\d{1,5})?(?:\/\S*)?$/i
const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?(?:\/\S*)?$/

function hasScheme(input: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(input)
}

/** Is `s` a plausible bare host (no scheme, no spaces)? */
function looksLikeHost(s: string): boolean {
  if (s.includes(' ')) return false
  return DOMAIN_RE.test(s) || LOCALHOST_RE.test(s) || IPV4_RE.test(s)
}

/** Strip control chars and surrounding whitespace. */
export function cleanAddressInput(input: string): string {
  let out = ''
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 32 || code === 127) continue
    out += ch
  }
  return out.trim()
}

/** Normalize a known-good http(s) URL: trim, drop hash, ensure protocol. */
export function normalizeHttpUrl(url: string): string {
  let u = url.trim()
  if (!u) return u
  // Drop surrounding angle brackets some clients paste.
  if (u.startsWith('<') && u.endsWith('>')) u = u.slice(1, -1).trim()
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u}`
  // Normalize through the URL parser; anchors are intentionally kept.
  const parsed = new URL(u)
  return parsed.toString()
}

/**
 * Classify what a user typed into the address/search box.
 */
export function classifyInput(rawInput: string): AddressResult {
  const input = cleanAddressInput(rawInput)
  if (!input) return { kind: 'invalid', reason: 'Empty input' }

  if (BLOCKED_SCHEMES.test(input)) {
    return { kind: 'invalid', reason: 'That link type is not allowed' }
  }

  if (hasScheme(input)) {
    const scheme = input.slice(0, input.indexOf(':')).toLowerCase()
    if (!SAFE_SCHEMES.has(scheme)) {
      return { kind: 'invalid', reason: `Links starting with “${scheme}:” are not allowed` }
    }
    try {
      return { kind: 'url', url: normalizeHttpUrl(input) }
    } catch {
      return { kind: 'invalid', reason: 'That does not look like a valid link' }
    }
  }

  if (looksLikeHost(input)) {
    try {
      return { kind: 'url', url: normalizeHttpUrl(input) }
    } catch {
      return { kind: 'search', query: input }
    }
  }

  return { kind: 'search', query: input }
}

/** Does a fully-qualified URL use a safe scheme? */
export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return SAFE_SCHEMES.has(u.protocol.replace(':', ''))
  } catch {
    return false
  }
}

/** Get a display hostname from a URL, e.g. `github.com`. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Hearth is local-first and its shell must not emit background third-party
 * requests merely to paint a shortcut. Auto icons therefore use the shared
 * local monogram fallback; uploaded/emoji artwork remains unchanged.
 */
export function faviconUrlFor(_url: string): string {
  return ''
}
