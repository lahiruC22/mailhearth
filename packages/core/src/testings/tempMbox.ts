import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function writeTempMbox(content: string | Buffer) {
  const dir = await mkdtemp(join(tmpdir(), "mailhearth-"));
  const path = join(dir, "temp.mbox");
  await writeFile(path, content);
  return {
    path,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
