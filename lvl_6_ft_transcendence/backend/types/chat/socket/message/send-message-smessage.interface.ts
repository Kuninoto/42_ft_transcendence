// Suffixed SMessage exclusively in this type because the suffix "Message"
// (refering to a socket server message) can be misleading
export interface SendMessageSMessage {
  readonly uniqueId: string;
  readonly receiverId: number;
  readonly content: string;
}
