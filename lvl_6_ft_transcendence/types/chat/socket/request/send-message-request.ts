export interface SendMessageRequest {
  readonly uniqueId: string;
  readonly receiverId: number;
  readonly content: string;
}
