import { describe, expect, it } from "vitest";
import { looksLikeBulk } from "../headers.js";
import { parseRawMessage } from "./parse.js";

const raw = (text: string) => Buffer.from(text.replaceAll("\n", "\r\n"), "utf8");

const BASIC = `From: Alice Example <alice@example.com>
To: Bob <bob@example.com>, carol@example.com
Subject: Lunch tomorrow?
Date: Mon, 01 Jan 2024 10:00:00 +0000
Message-ID: <abc123@example.com>
Content-Type: text/plain; charset=utf-8

Are you free at noon?
`;

describe("parseRawMessage", () => {
  it("extracts the basic fields", async () => {
    const message = await parseRawMessage(raw(BASIC));

    expect(message.provider).toBe("mbox");
    expect(message.from).toEqual({ name: "Alice Example", address: "alice@example.com" });
    expect(message.to.map((a) => a.address)).toEqual(["bob@example.com", "carol@example.com"]);
    expect(message.subject).toBe("Lunch tomorrow?");
    expect(message.date.toISOString()).toBe("2024-01-01T10:00:00.000Z");
    expect(message.textBody?.trim()).toBe("Are you free at noon?");
  });

  it("derives a stable, content-based id", async () => {
    const a = await parseRawMessage(raw(BASIC));
    const b = await parseRawMessage(raw(BASIC));
    const c = await parseRawMessage(raw(BASIC.replace("noon", "one")));

    expect(a.id).toBe(b.id);
    expect(a.id).not.toBe(c.id);
    expect(a.id).toMatch(/^mbox:[0-9a-f]{32}$/);
  });

  it("lower-cases header names and unfolds long values", async () => {
    const message = await parseRawMessage(
      raw(`From: news@example.com
Subject: Weekly digest
List-Unsubscribe: <https://example.com/u/1>,
 <mailto:unsub@example.com>
Precedence: bulk

hello
`),
    );

    expect(message.headers["list-unsubscribe"]).toBe(
      "<https://example.com/u/1>, <mailto:unsub@example.com>",
    );
    expect(looksLikeBulk(message.headers)).toBe(true);
  });

  it("decodes encoded-word subjects and UTF-8 bodies", async () => {
    const message = await parseRawMessage(
      Buffer.from(
        "From: a@example.com\r\nSubject: =?UTF-8?B?Q2Fmw6k=?=\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nhéllo ✓\r\n",
        "utf8",
      ),
    );
    expect(message.subject).toBe("Café");
    expect(message.textBody).toContain("héllo ✓");
  });

  it("reads Gmail Takeout labels and thread id", async () => {
    const message = await parseRawMessage(
      raw(`From: a@example.com
X-Gmail-Labels: Inbox,Category Promotions,Unread
X-GM-THRID: 1803928339457839178

hi
`),
    );
    expect(message.providerLabels).toEqual(["Inbox", "Category Promotions", "Unread"]);
    expect(message.threadId).toBe("1803928339457839178");
  });

  it("falls back safely when From and Date are missing", async () => {
    const message = await parseRawMessage(raw("Subject: no sender\n\nbody\n"));
    expect(message.from.address).toBe("unknown@mailhearth.invalid");
    expect(message.date.getTime()).toBe(0);
    expect(message.to).toEqual([]);
    expect(message.providerLabels).toEqual([]);
  });

  it("omits optional fields instead of setting them to undefined", async () => {
    const message = await parseRawMessage(raw("From: a@example.com\n\nhi\n"));
    expect("threadId" in message).toBe(false);
  });
});
