import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseErrorResponseDto } from '@/libs/dto/database-error-response.dto';
import { Public } from '@/infrastructure/auth/decorators/public.decorator';
import { DatabaseConnectionException } from '@/libs/exceptions/database.exception';

interface DatabaseDetails {
  host?: string;
  port?: number;
  database?: string;
  connectionCount?: number;
}

interface DatabaseConnectionOptions {
  host?: string;
  port?: number;
  database?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      error?: string;
      details?: {
        host?: string;
        port?: number;
        database?: string;
        connectionCount?: number;
      };
    };
    application: {
      status: 'running';
      uptime: number;
      version: string;
      environment: string;
    };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the application and database connection',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application and database are healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], example: 'ok' },
        timestamp: { type: 'string', example: '2025-09-06T18:30:00.000Z' },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['connected', 'disconnected', 'error'],
                  example: 'connected',
                },
                responseTime: { type: 'number', example: 45 },
                details: {
                  type: 'object',
                  properties: {
                    host: { type: 'string', example: 'localhost' },
                    port: { type: 'number', example: 5432 },
                    database: { type: 'string', example: 'user_management' },
                    connectionCount: { type: 'number', example: 5 },
                  },
                },
              },
            },
            application: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'running' },
                uptime: { type: 'number', example: 3600 },
                version: { type: 'string', example: '1.0.0' },
                environment: { type: 'string', example: 'development' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database connection failed',
    type: DatabaseErrorResponseDto,
  })
  async healthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    let databaseError: string | undefined;
    let databaseDetails: DatabaseDetails = {};
    let responseTime: number | undefined;

    try {
      // 데이터베이스 연결 상태 확인
      await this.dataSource.query('SELECT 1');

      responseTime = Date.now() - startTime;
      databaseStatus = 'connected';

      // 데이터베이스 세부 정보 수집
      const connectionOptions = this.dataSource
        .options as DatabaseConnectionOptions;
      databaseDetails = {
        host: connectionOptions.host,
        port: connectionOptions.port,
        database: connectionOptions.database,
        connectionCount: this.dataSource.manager.connection.createQueryRunner
          ? this.getConnectionCount()
          : undefined,
      };
    } catch (error: unknown) {
      databaseStatus = 'error';
      databaseError =
        error instanceof Error ? error.message : 'Unknown database error';
      responseTime = Date.now() - startTime;
    }

    const response: HealthCheckResponse = {
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: databaseStatus,
          responseTime,
          error: databaseError,
          details: databaseStatus === 'connected' ? databaseDetails : undefined,
        },
        application: {
          status: 'running',
          uptime: Math.floor(process.uptime()),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      },
    };

    // 데이터베이스 연결 실패 시 503 상태 코드 반환
    if (databaseStatus !== 'connected') {
      throw new DatabaseConnectionException(
        'Database health check failed',
        databaseError,
      );
    }

    return response;
  }

  @Public()
  @Get('database')
  @ApiOperation({
    summary: 'Database-specific health check',
    description: 'Detailed database connection and performance check',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database connection is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'connected' },
        responseTime: { type: 'number', example: 25 },
        timestamp: { type: 'string', example: '2025-09-06T18:30:00.000Z' },
        details: {
          type: 'object',
          properties: {
            version: { type: 'string', example: 'PostgreSQL 14.5' },
            connectionCount: { type: 'number', example: 3 },
            maxConnections: { type: 'number', example: 100 },
            activeQueries: { type: 'number', example: 1 },
            databaseSize: { type: 'string', example: '52 MB' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database connection failed',
    type: DatabaseErrorResponseDto,
  })
  async databaseHealth() {
    const startTime = Date.now();

    try {
      // 기본 연결 확인
      await this.dataSource.query('SELECT 1');

      // 데이터베이스 세부 정보 조회
      const [versionResult]: any[] =
        await this.dataSource.query('SELECT version()');
      const [connectionResult]: any[] = await this.dataSource.query(`
        SELECT 
          count(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      const [sizeResult]: any[] = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `);

      const responseTime = Date.now() - startTime;

      return {
        status: 'connected',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          version: String(versionResult.version).split(' on ')[0], // 간단한 버전 정보만
          connectionCount: Number(connectionResult.active_connections),
          maxConnections: Number(connectionResult.max_connections),
          databaseSize: String(sizeResult.database_size),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';
      throw new DatabaseConnectionException(
        'Database detailed health check failed',
        errorMessage,
      );
    }
  }

  private getConnectionCount(): number {
    // TypeORM의 connection pool 정보를 가져오는 로직
    // 실제 구현은 사용하는 connection pool에 따라 달라질 수 있음
    try {
      const driver = this.dataSource.driver as any;
      return driver.master?.connectionLimit || 0;
    } catch {
      return 0;
    }
  }
}
