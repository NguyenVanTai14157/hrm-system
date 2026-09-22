import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient } from './client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client;
  constructor(config: ConfigService) {
    this.client = createPrismaClient(config.getOrThrow<string>('DATABASE_URL'));
  }
  async onModuleDestroy() { await this.client.$disconnect(); }
}
