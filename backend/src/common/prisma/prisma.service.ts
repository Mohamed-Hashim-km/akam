import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import type { QueryResultRow } from 'pg';

const { Pool } = pg;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly pool: pg.Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected pool error', err);
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.logger.log('✅ Database connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database pool closed');
  }

  /**
   * Execute a query with parameters. Returns all rows.
   */
  async query<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, params);
    return result.rows;
  }

  /**
   * Execute a query and return the first row or null.
   */
  async queryOne<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await this.pool.query<T>(text, params);
    return result.rows[0] ?? null;
  }

  /**
   * Execute a command (INSERT/UPDATE/DELETE) and return affected row count.
   */
  async execute(text: string, params?: unknown[]): Promise<number> {
    const result = await this.pool.query(text, params);
    return result.rowCount ?? 0;
  }
}
