import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SMS_PROVIDER } from './providers/sms/sms-provider.interface';
import { EskizSmsProvider } from './providers/sms/eskiz-sms.provider';
import { ConsoleSmsProvider } from './providers/sms/console-sms.provider';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('ESKIZ_EMAIL') && config.get('ESKIZ_PASSWORD')
          ? new EskizSmsProvider(config)
          : new ConsoleSmsProvider(),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
