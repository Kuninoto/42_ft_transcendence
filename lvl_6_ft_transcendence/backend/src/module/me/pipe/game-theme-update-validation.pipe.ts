import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { GameThemes } from 'src/common/types/game-themes.enum';

@Injectable()
export class GameThemeUpdateValidationPipe implements PipeTransform<any> {
  private readonly logger: Logger = new Logger();

  readonly themes = [
    'default',
    'fortyTwo',
    'anime',
    'monke',
    'melo',
    'miki',
    'mikao',
  ];

  transform(value: { newGameTheme: GameThemes }): GameThemes {
    const response = value.newGameTheme;

    if (!response || !this.themes.includes(response)) {
      this.logger.error(
        'A request to update a game theme was made with an invalid game theme',
      );
      throw new BadRequestException('Invalid game theme');
    }

    return response;
  }
}
