import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { GameThemeUpdationRequest, GameThemes } from 'types';

@Injectable()
export class GameThemeUpdateValidationPipe implements PipeTransform<any> {
  private readonly logger: Logger = new Logger(
    GameThemeUpdateValidationPipe.name,
  );

  transform(value: GameThemeUpdationRequest): GameThemes {
    const response: GameThemes = value.newGameTheme;

    if (
      !response ||
      !Object.values(GameThemes).some((value: string) => response === value)
    ) {
      this.logger.warn(
        'A request to update a game theme was made with an invalid game theme',
      );
      throw new BadRequestException('Invalid game theme');
    }

    return response;
  }
}
