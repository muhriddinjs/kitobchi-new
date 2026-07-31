import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({ error: body });
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          body: { code: httpStatusCode(status), message: response },
        };
      }

      const responseObj = response as Record<string, unknown>;
      const message = Array.isArray(responseObj.message)
        ? (responseObj.message as string[]).join('; ')
        : ((responseObj.message as string) ?? exception.message);

      return {
        status,
        body: {
          code: (responseObj.code as string) ?? httpStatusCode(status),
          message,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    };
  }
}

function httpStatusCode(status: number): string {
  return HttpStatus[status] ?? 'ERROR';
}
