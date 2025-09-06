import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<any>();
    const { method, url, body, query, params } = request;
    const userInfo = request.user ? `User: ${request.user.email}` : 'Anonymous';

    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} | ${userInfo} | Body: ${JSON.stringify(
        body,
      )} | Query: ${JSON.stringify(query)} | Params: ${JSON.stringify(params)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.log(
          `Outgoing Response: ${method} ${url} | ${responseTime}ms | ${userInfo}`,
        );
      }),
    );
  }
}
