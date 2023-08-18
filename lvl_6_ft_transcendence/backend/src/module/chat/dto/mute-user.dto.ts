
export interface MuteUserDTO {
	readonly userId: number, 
	readonly roomId: number;
	readonly duration: '30m' | '1h' | '2h',
}