import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const host = process.env.REDIS_HOST || 'redis';
    const port = Number(process.env.REDIS_PORT || 6379);

    this.client = new Redis({ host, port });

    this.client.on('connect', () =>
      this.logger.log(`🔌 Connected to Redis at ${host}:${port}`),
    );
    this.client.on('error', (err) =>
      this.logger.error(`❌ Redis Error: ${err.message}`),
    );
  }

  async getClient() {
    return this.client;
  }

  async clearPattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (!keys.length) {
      this.logger.debug(`No keys found for pattern: ${pattern}`);
      return;
    }

    await this.client.del(...keys);
    this.logger.log(`🧹 Cleared ${keys.length} keys for pattern: ${pattern}`);
  }

  async set<T>(key: string, value: T, ttl?: number) {
    const serialized = JSON.stringify(value);
    if (ttl) await this.client.set(key, serialized, 'EX', ttl);
    else await this.client.set(key, serialized);
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
