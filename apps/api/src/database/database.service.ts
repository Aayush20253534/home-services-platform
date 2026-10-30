import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@home-services/database';

/**
 * PrismaClient is lazy: API liveness stays available if the DB is not ready.
 * /health/ready explicitly checks connectivity before traffic is directed here.
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
