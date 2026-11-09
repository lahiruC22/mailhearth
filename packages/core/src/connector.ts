import type { Message, MessageId } from "./types.js";

export interface ListOptions {
  readonly since?: Date;
  readonly pageSize?: number;
  readonly cursor?: string;
}

export interface ListResult {
  readonly messages: readonly Message[];
  readonly nextCursor?: string;
}

/**
 * The provider boundary: IMAP, mbox and the Gmail API all implement this.
 * `moveToTrash` MUST move to the provider's trash, never permanently delete.
 */
export interface MailConnector {
  readonly kind: "mbox" | "imap" | "gmail";
  readonly canModify: boolean;

  listMessages(options?: ListOptions): Promise<ListResult>;
  fetchMessage(id: MessageId): Promise<Message>;

  applyLabel(ids: readonly MessageId[], label: string): Promise<void>;
  moveToTrash(ids: readonly MessageId[]): Promise<void>;
  restore(ids: readonly MessageId[]): Promise<void>;
}

export class UnsupportedOperationError extends Error {
  constructor(operation: string, connectorKind: string) {
    super(`"${operation}" is not supported by the "${connectorKind}" connector.`);
    this.name = "UnsupportedOperationError";
  }
}
