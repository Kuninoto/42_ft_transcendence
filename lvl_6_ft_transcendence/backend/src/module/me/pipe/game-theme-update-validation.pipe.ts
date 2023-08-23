import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { GameThemeUpdationRequest, GameThemes } from 'types';

@Injectable()
export class GameThemeUpdateValidationPipe implements PipeTransform<any> {
  private readonly logger: Logger = new Logger();

  readonly themes: string[] = [
    'default',
    'safari',
    'fortyTwo',
    'monke',
    'miki',
    'mikao',
  ];

  transform(value: GameThemeUpdationRequest): GameThemes {
    const response: GameThemes = value.newGameTheme;

    if (!response || !this.themes.includes(response)) {
      this.logger.warn(
        'A request to update a game theme was made with an invalid game theme',
      );
      throw new BadRequestException('Invalid game theme');
    }

    return response;
  }
}
