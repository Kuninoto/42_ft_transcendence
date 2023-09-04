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
  private readonly logger: Logger = new Logger(NonNegativeIntPipe.name);

  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const val: number = await super.transform(value, metadata);
  
    if (val <= 0) {
      this.logger.warn('A request was made with a UID <= 0');
      throw new BadRequestException('Invalid user id: Ids must be >= 1');
    }
    return val;
  }
}
