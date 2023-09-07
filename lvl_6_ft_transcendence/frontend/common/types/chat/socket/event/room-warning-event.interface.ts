import { RoomWarning } from '../../room-warning.enum'

export interface RoomWarningEvent {
	readonly affectedUID: number
	readonly roomId: number
	readonly warning: string
	readonly warningType: RoomWarning
}
