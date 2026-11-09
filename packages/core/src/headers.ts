export interface UnsubscribeTargets {
  readonly mailto: readonly string[];
  readonly http: readonly string[];
}

/**
 * Headers come from untrusted mail. Real List-Unsubscribe values are a few hundred bytes,
 * so refuse to scan absurdly long ones (defence in depth against slow-regex input).
 */
const MAX_HEADER_LENGTH = 8192;

function addUnsubscribeTarget(target: string | undefined, mailto: string[], http: string[]): void {
  const trimmed = target?.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("mailto:")) mailto.push(trimmed);
  else if (lower.startsWith("https://") || lower.startsWith("http://")) http.push(trimmed);
}

// Parses e.g. `<mailto:unsub@example.com>, <https://example.com/u/123>`.
export function parseListUnsubscribe(value: string | undefined): UnsubscribeTargets {
  const mailto: string[] = [];
  const http: string[] = [];

  if (!value || value.length > MAX_HEADER_LENGTH) return { mailto, http };

  for (const match of value.matchAll(/<([^<>]+)>/g)) {
    addUnsubscribeTarget(match[1], mailto, http);
  }

  return { mailto, http };
}

export function looksLikeBulk(headers: Readonly<Record<string, string>>): boolean {
  if (headers["list-unsubscribe"]) return true;
  if (headers["list-id"]) return true;

  const precedence = headers.precedence?.toLowerCase();
  if (["bulk", "list", "junk"].includes(precedence ?? "")) return true;

  const autoSubmitted = headers["auto-submitted"]?.toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;

  return false;
}
