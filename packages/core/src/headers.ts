export interface UnsubscribeTargets {
  readonly mailto: readonly string[];
  readonly http: readonly string[];
}

// Parses e.g. `<mailto:unsub@example.com>, <https://example.com/u/123>`.
export function parseListUnsubscribe(value: string | undefined): UnsubscribeTargets {
  const mailto: string[] = [];
  const http: string[] = [];

  if (!value) return { mailto, http };

  for (const match of value.matchAll(/<([^>]+)>/g)) {
    const target = match[1]?.trim();
    if (!target) continue;
    const lower = target.toLowerCase();
    if (lower.startsWith("mailto:")) mailto.push(target);
    else if (lower.startsWith("https://") || lower.startsWith("http://")) http.push(target);
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
