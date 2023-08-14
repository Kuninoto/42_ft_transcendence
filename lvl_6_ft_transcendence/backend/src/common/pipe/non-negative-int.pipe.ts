import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
  ParseIntPipe,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class NonNegativeIntPipe extends ParseIntPipe implements PipeTransform {
  private readonly logger: Logger = new Logger();

  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const val = await super.transform(value, metadata);
    if (val < 0) {
      this.logger.warn('A request was made with a user id < 0');
      throw new BadRequestException('Invalid id value. Ids must be positive');
    }
    return val;
  }
}
