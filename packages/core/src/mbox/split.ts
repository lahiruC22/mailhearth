import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const FROM_LINE = /^From \S+ +(?:\w{3} +){2}\d{1,2} +\d{2}:\d{2}:\d{2}(?: +[+-]\d{4})? +\d{4}\s*$/;
const ESCAPED_FROM = /^>+From /;

export async function* splitMbox(path: string): AsyncGenerator<Buffer> {
  const stream = await createReadStream(path, { encoding: "latin1" });
  const lines = createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY });

  try {
    let current: string[] | undefined;

    for await (const line of lines) {
      if (FROM_LINE.test(line)) {
        if (current) yield toBuffer(current);
        current = [];
        continue;
      }

      if (current === undefined) continue;
      current.push(ESCAPED_FROM.test(line) ? line.slice(1) : line);
    }
    if (current) yield toBuffer(current);
  } finally {
    lines.close();
    stream.destroy();
  }
}

function toBuffer(lines: string[]): Buffer {
  if (lines.at(-1) === "") lines.pop(); // blank line belongs to the separator
  return Buffer.from(lines.join("\n"), "latin1");
}
