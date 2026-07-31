import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Redis');
        const client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
          connectTimeout: 10_000,
          commandTimeout: 8_000,
          maxRetriesPerRequest: 2,
        });
        client.on('error', (err) =>
          logger.error(`Connection error: ${err.message}`),
        );
        client.on('connect', () => logger.log('TCP connected'));
        client.on('ready', () => logger.log('Ready to accept commands'));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy() {
    await this.client.quit();
  }
}
