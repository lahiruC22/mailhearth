import type { Message } from "../types.js";
import { parseRawMessage } from "./parse.js";
import { splitMbox } from "./split.js";

export interface ReadMBoxOptions {
  // Called for each message that fails to parse. The scan continues with the next one.
  readonly onError?: (error: unknown, index: number) => void;

  // Injectable for tests. Defaults to the real MIME parser.
  readonly parse?: (raw: Buffer) => Promise<Message>;
}

export async function* readMbox(
  path: string,
  options: ReadMBoxOptions = {},
): AsyncGenerator<Message> {
  const parse = options.parse ?? parseRawMessage;
  let index = 0;

  for await (const raw of splitMbox(path)) {
    let message: Message;
    try {
      message = await parse(raw);
    } catch (error) {
      options.onError?.(error, index);
      index++;
      continue;
    }
    yield message;
    index++;
  }
}
