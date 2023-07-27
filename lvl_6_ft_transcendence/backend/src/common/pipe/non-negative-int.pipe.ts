import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ParseIntPipe,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class NonNegativeIntPipe extends ParseIntPipe implements PipeTransform {
  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const val = await super.transform(value, metadata);
    if (val < 0) {
      throw new BadRequestException('Invalid id value. Ids must be positive');
    }
    return val;
  }
}
