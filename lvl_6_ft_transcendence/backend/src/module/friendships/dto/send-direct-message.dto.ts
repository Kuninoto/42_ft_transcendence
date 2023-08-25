export interface SendDirectMessageDTO {
  readonly uniqueId: string;
  readonly receiverUID: number;
  readonly content: string;
}
