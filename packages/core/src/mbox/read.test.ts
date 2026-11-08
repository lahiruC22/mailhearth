import { afterEach, describe, expect, it, vi } from "vitest";
import { writeTempMbox } from "../testings/tempMbox.js";
import { asMessageId, type Message } from "../types.js";
import { readMbox } from "./read.js";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((fn) => fn()));
});

const MBOX = [
  "From a Mon Jan  1 10:00:00 2024",
  "From: one@example.com",
  "Subject: one",
  "",
  "first",
  "",
  "From a Mon Jan  1 11:00:00 2024",
  "From: two@example.com",
  "Subject: two",
  "",
  "second",
  "",
].join("\n");

async function open(content: string): Promise<string> {
  const { path, cleanup } = await writeTempMbox(content);
  cleanups.push(cleanup);
  return path;
}

describe("readMbox", () => {
  it("yields parsed messages in file order", async () => {
    const subjects: string[] = [];
    for await (const message of readMbox(await open(MBOX))) subjects.push(message.subject);
    expect(subjects).toEqual(["one", "two"]);
  });

  it("skips messages that fail to parse and reports them", async () => {
    const onError = vi.fn();
    let calls = 0;
    const parse = async (): Promise<Message> => {
      calls++;
      if (calls === 1) throw new Error("corrupt");
      return {
        id: asMessageId("ok"),
        provider: "mbox",
        from: { address: "x@example.com" },
        to: [],
        subject: "survivor",
        date: new Date(0),
        headers: {},
        providerLabels: [],
      };
    };

    const subjects: string[] = [];
    for await (const m of readMbox(await open(MBOX), { parse, onError })) subjects.push(m.subject);

    expect(subjects).toEqual(["survivor"]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 0);
  });

  it("can be stopped early without errors", async () => {
    for await (const message of readMbox(await open(MBOX))) {
      expect(message.subject).toBe("one");
      break;
    }
  });

  it("rejects with ENOENT when the file does not exist", async () => {
    const consume = async () => {
      for await (const _ of readMbox("/definitely/not/here.mbox")) {
        // nothing to do
      }
    };
    await expect(consume()).rejects.toMatchObject({ code: "ENOENT" });
  });
});
