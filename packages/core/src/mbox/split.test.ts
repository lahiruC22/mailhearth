import { afterEach, describe, expect, it } from "vitest";
import { writeTempMbox } from "../testings/tempMbox.js";
import { splitMbox } from "./split.js";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((fn) => fn()));
});

async function split(content: string | Buffer): Promise<string[]> {
  const { path, cleanup } = await writeTempMbox(content);
  cleanups.push(cleanup);
  const chunks: string[] = [];
  for await (const chunk of splitMbox(path)) chunks.push(chunk.toString("utf8"));
  return chunks;
}

const FROM_1 = "From MAILER-DAEMON Mon Jan  1 10:00:00 2024";
const FROM_2 = "From MAILER-DAEMON Tue Jan  2 11:30:00 2024";

describe("splitMbox", () => {
  it("yields nothing for an empty file", async () => {
    expect(await split("")).toEqual([]);
  });

  it("splits two messages and strips the From_ separator lines", async () => {
    const chunks = await split(
      `${FROM_1}\nSubject: one\n\nbody one\n\n${FROM_2}\nSubject: two\n\nbody two\n`,
    );
    expect(chunks).toEqual(["Subject: one\n\nbody one", "Subject: two\n\nbody two"]);
  });

  it("ignores junk before the first From_ line", async () => {
    const chunks = await split(`garbage\n${FROM_1}\nSubject: one\n\nhi\n`);
    expect(chunks).toEqual(["Subject: one\n\nhi"]);
  });

  it("recognises the Gmail Takeout separator format", async () => {
    const takeout = "From 1803928339457839178@xxx Sat Oct 18 14:22:03 +0000 2025";
    expect(await split(`${takeout}\nSubject: hi\n\nbody\n`)).toHaveLength(1);
  });

  it("does not split on a body line that merely starts with 'From '", async () => {
    const chunks = await split(`${FROM_1}\nSubject: x\n\nFrom the desk of someone\nmore\n`);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("From the desk of someone");
  });

  it("un-escapes mboxrd '>From ' lines inside bodies", async () => {
    const chunks = await split(`${FROM_1}\nSubject: x\n\n>From the archive\n>>From deeper\n`);
    expect(chunks[0]).toContain("\nFrom the archive\n>From deeper");
  });

  it("handles CRLF line endings", async () => {
    const chunks = await split(`${FROM_1}\r\nSubject: one\r\n\r\nbody\r\n`);
    expect(chunks).toEqual(["Subject: one\n\nbody"]);
  });

  it("preserves non-ASCII bytes exactly", async () => {
    const content = Buffer.from(`${FROM_1}\nSubject: x\n\nhéllo wörld ✓\n`, "utf8");
    expect((await split(content))[0]).toContain("héllo wörld ✓");
  });
});
