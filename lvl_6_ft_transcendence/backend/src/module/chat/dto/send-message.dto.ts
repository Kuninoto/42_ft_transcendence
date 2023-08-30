export interface SendMessageDTO {
  readonly uniqueId: string;
  readonly receiverId: number;
  readonly content: string;
}
