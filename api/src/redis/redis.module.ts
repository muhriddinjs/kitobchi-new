import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          url: config.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
          token: config.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
          automaticDeserialization: false,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
