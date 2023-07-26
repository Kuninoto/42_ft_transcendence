import {
  PipeTransform,
  Injectable,
  BadRequestException
} from '@nestjs/common';
import { GameThemes } from '../../../../common/types/game-themes.enum.ts'

@Injectable()
export class FriendshipStatusUpdateValidationPipe implements PipeTransform<any> {
  readonly themes = [
    'default',
    'forty_two',
    'anime',
    'monke',
    'melo',
    'miki',
    'mikao'
  ];

  transform(value: { newGameTheme: GameThemes }): GameThemes {
    const response = value.newGameTheme;
    
    if (!response || !this.themes.includes(response)) {
      throw new BadRequestException('Invalid game theme');
    }

    return response;
  }
}
