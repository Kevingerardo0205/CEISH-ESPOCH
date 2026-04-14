// src/app/app.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World lilicita!';
  }

  /**
   * Prueba de conexión a PostgreSQL
   * @returns Estado de la conexión y detalles del servidor
   */
  async testQuery() {
    const startTime = Date.now();
    
    try {
      // Verificar si la conexión está activa
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource no está inicializado');
      }

      // Ejecutar query de prueba
      const result = await this.dataSource.query('SELECT 1 as test, NOW() as current_timestamp');
      
      const executionTime = Date.now() - startTime;
      
      this.logger.log(`✅ Conexión exitosa a PostgreSQL (${executionTime}ms)`);
      
      return {
        success: true,
        message: 'Conexión exitosa a PostgreSQL',
        data: {
          test: result[0].test,
          timestamp: result[0].current_timestamp,
          execution_time_ms: executionTime,
          database: this.dataSource.options.database,
          host: (this.dataSource.options as any).host,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`❌ Error al conectar a PostgreSQL (${executionTime}ms)`, error);
      
      return {
        success: false,
        message: 'Error al conectar a PostgreSQL',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Verificar estado de los schemas (public y ml_features)
   */
  async checkSchemas() {
    try {
      const schemas = await this.dataSource.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('public', 'ml_features')
        ORDER BY schema_name
      `);
      
      return {
        success: true,
        message: 'Schemas verificados correctamente',
        data: {
          schemas_encontrados: schemas.map((s: any) => s.schema_name),
          total: schemas.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al verificar schemas',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Contar tablas por schema (para validar migración)
   */
  async countTablesBySchema() {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          table_schema,
          COUNT(*) as numero_tablas
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'ml_features')
        GROUP BY table_schema
        ORDER BY table_schema
      `);
      
      return {
        success: true,
        message: 'Conteo de tablas exitoso',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al contar tablas',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}