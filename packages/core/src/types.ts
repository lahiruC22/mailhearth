export const CATEGORIES = [
  "personal",
  "work",
  "finance",
  "travel",
  "accounts-security",
  "newsletters",
  "promotions",
  "social",
  "alerts",
  "junk",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ProviderKind = "mbox" | "imap" | "gmail";

export interface EmailAddress {
  readonly name?: string;
  readonly address: string;
}

export type MessageId = string & { readonly __brand: "MessageId" };

export const asMessageId = (value: string): MessageId => value as MessageId;

export interface Message {
  readonly id: MessageId;
  readonly provider: ProviderKind;
  readonly threadId?: string;
  readonly from: EmailAddress;
  readonly to: readonly EmailAddress[];
  readonly subject: string;
  readonly date: Date;
  readonly headers: Readonly<Record<string, string>>;
  readonly textBody?: string;
  readonly providerLabels?: readonly string[];
}

export interface Classification {
  readonly messageId: MessageId;
  readonly category: Category;
  readonly confidence: number;
  readonly reason: string;
  readonly source: "rules" | "embeddings" | "llm" | "user";
}

export type ActionKind = "label" | "archive" | "trash" | "restore";

export interface Action {
  readonly id: string;
  readonly kind: ActionKind;
  readonly messageId: readonly MessageId[];
  readonly label?: string;
  readonly createdAt: Date;
}
