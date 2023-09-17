import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('app')
@ApiTags('app')
export class AppController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly http: HttpHealthIndicator,
  ) {}

  @ApiOperation({
    description: 'Performs an health check on HTTP and DB connection',
  })
  @Get('/health')
  @HealthCheck()
  async getHello(): Promise<HealthCheckResult> {
    return await this.health.check([
      // DB
      async () => this.db.pingCheck('typeorm'),

      // HTTP
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
