export interface SendDirectMessageDTO {
  readonly content: string;
  readonly receiverUID: number;
  readonly uniqueId: string;
}
