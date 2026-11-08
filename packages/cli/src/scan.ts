import { looksLikeBulk, readMbox } from "@mailhearth/core";

export interface ScanSummary {
  readonly total: number;
  readonly bulk: number;
  readonly failed: number;
}

export async function summarizeMbox(path: string): Promise<ScanSummary> {
  let total = 0;
  let bulk = 0;
  let failed = 0;

  for await (const message of readMbox(path, {
    onError: () => {
      failed++;
    },
  })) {
    total++;
    if (looksLikeBulk(message.headers)) bulk++;
  }

  return { total, bulk, failed };
}

export function formatSummary(summary: ScanSummary): string {
  const percent = summary.total === 0 ? 0 : Math.round((summary.bulk / summary.total) * 100);
  const lines = [
    `Scanned ${summary.total} messages`,
    `Bulk or automated: ${summary.bulk} (${percent}%)`,
  ];
  if (summary.failed > 0) lines.push(`Failed to parse ${summary.failed} messages`);
  return lines.join("\n");
}
