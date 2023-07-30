import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString } from 'class-validator';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';

export class OpponentFoundDTO {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsEnum(PlayerSide)
  side: PlayerSide;

  @ApiProperty()
  @IsObject()
  opponentInfo: UserSearchInfo;
}
