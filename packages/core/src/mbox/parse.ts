import { createHash } from "node:crypto";
import { type AddressObject, type ParsedMail, simpleParser } from "mailparser";
import { asMessageId, type EmailAddress, type Message } from "../types.js";

const UNKNOWN_SENDER: EmailAddress = { address: "unknown@mailhearth.invalid" };

export async function parseRawMessage(raw: Buffer): Promise<Message> {
  const parsed = await simpleParser(raw);
  const headers = flattenHeaders(parsed.headerLines);
  const threadId = headers["x-gm-thrid"];

  return {
    id: asMessageId(`mbox:${createHash("sha256").update(raw).digest("hex").slice(0, 32)}`),
    provider: "mbox",
    ...(threadId ? { threadId } : {}),
    from: toAddresses(parsed.from)?.[0] ?? UNKNOWN_SENDER,
    to: toAddresses(parsed.to),
    subject: parsed.subject ?? "",
    date: parsed.date ?? new Date(0),
    headers,
    ...(parsed.text ? { textBody: parsed.text } : {}),
    providerLabels: splitLabels(headers["x-gmail-labels"]),
  };
}

/**
 * Flattens the header lines into a key-value record.
 * @param lines - The header lines to flatten.
 * @returns A record of header names and their values.
 */
function flattenHeaders(lines: ParsedMail["headerLines"]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const { key, line } of lines) {
    if (Object.hasOwn(headers, key)) continue;
    const value = line.slice(line.indexOf(":") + 1);
    headers[key] = value.replace(/\r?\n[ \t]+/g, " ").trim();
  }
  return headers;
}

function toAddresses(field: AddressObject | AddressObject[] | undefined): EmailAddress[] {
  const objects = field === undefined ? [] : Array.isArray(field) ? field : [field];
  return objects
    .flatMap((obj) => obj.value)
    .flatMap(({ address, name }) => (address ? [name ? { name, address } : { address }] : []));
}

function splitLabels(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean)
    : [];
}
