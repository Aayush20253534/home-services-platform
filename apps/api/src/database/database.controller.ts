import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('health')
export class DatabaseController {
  constructor(private readonly database: DatabaseService) {}

  @Get('ready')
  async readiness(): Promise<{ status: 'ready'; database: 'postgresql'; spatial: 'postgis' }> {
    try {
      const versions = await this.database.$queryRaw<Array<{ version: string }>>`
        SELECT PostGIS_Version() AS "version"
      `;
      if (!versions[0]?.version) throw new Error('PostGIS not available');
      return { status: 'ready', database: 'postgresql', spatial: 'postgis' };
    } catch {
      // Do not expose DB connection strings, internal errors or operational details.
      throw new ServiceUnavailableException('Database is not ready');
    }
  }
}
