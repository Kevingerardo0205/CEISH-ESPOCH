/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { DataSource } from 'typeorm';
import { BusinessDayCalculator } from '../src/shared/services/deadline-calculator.service';
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';

describe('Real Database Integration Tests (ceish_test_db on localhost:3100)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 3100,
      username: 'ceish_user',
      password: 'ceish_password',
      database: 'ceish_test_db',
      entities: [
        'src/modules/**/infrastructure/database/**/*.entity.orm.ts',
        'src/modules/**/infrastructure/database/**/*.orm-entity.ts',
        'src/modules/**/infrastructure/database/*.entity.orm.ts',
        'src/modules/**/domain/entities/*.entity.ts',
      ],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();

    // Limpiar y sembrar datos de prueba aislados en ceish_test_db
    await dataSource.query(`
      DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9999);
      DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9999;
      DELETE FROM public.versiones_protocolo WHERE id = 9999;
      DELETE FROM public.protocolos WHERE id = 999;
      DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904);

      INSERT INTO catalogos.usuarios (id, email_institucional, nombres_completos, cedula)
      VALUES 
        (901, 'eval1@test.com', 'Eval Uno', '1111111111'),
        (902, 'eval2@test.com', 'Eval Dos', '2222222222'),
        (903, 'eval3@test.com', 'Eval Tres', '3333333333'),
        (904, 'eval4@test.com', 'Eval Cuatro', '4444444444')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO catalogos.niveles_riesgo (id, codigo, nombre, tipo_revision, activo)
      VALUES (1, 'MINIMO', 'Riesgo Minimo', 'EXPEDITA', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id)
      VALUES (999, 'Protocolo de Integracion Real', 901)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (9999, 999, 1, 1)
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9999);
        DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9999;
        DELETE FROM public.versiones_protocolo WHERE id = 9999;
        DELETE FROM public.protocolos WHERE id = 999;
        DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904);
      `);
      await dataSource.destroy();
    }
  });

  it('1. Debe guardar y leer fecha_limite exacta en columna PostgreSQL date como 2026-03-12 (EXPEDITA) y 2026-03-23 (PLENO)', async () => {
    // Simulación de asignación para Lunes 2 de marzo de 2026 (10:00 UTC = 05:00 ECT)
    const startDate = new Date('2026-03-02T10:00:00.000Z');

    const expeditaDeadline =
      BusinessDayCalculator.calculateDeadlineDateString({
        startDate,
        businessDaysToAdd: 8,
        holidays: [],
      });

    const plenoDeadline = BusinessDayCalculator.calculateDeadlineDateString({
      startDate,
      businessDaysToAdd: 15,
      holidays: [],
    });

    // Insertar asignaciones reales en ceish_test_db
    await dataSource.query(
      `
      INSERT INTO evaluacion.asignaciones_evaluacion (
        id, version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_limite, fecha_asignacion
      ) VALUES 
        (9901, 9999, 901, ${AssignmentStatus.ASSIGNED}, true, $1, $3),
        (9902, 9999, 902, ${AssignmentStatus.ASSIGNED}, true, $2, $3)
      ON CONFLICT (id) DO UPDATE SET fecha_limite = EXCLUDED.fecha_limite;
    `,
      [expeditaDeadline, plenoDeadline, startDate],
    );

    // Consulta SQL directa contra PostgreSQL
    const rows = await dataSource.query(`
      SELECT id, fecha_limite::text AS fecha_limite_str, fecha_limite 
      FROM evaluacion.asignaciones_evaluacion 
      WHERE version_id = 9999 
      ORDER BY id ASC;
    `);

    expect(rows).toHaveLength(2);
    // Verificación exacta de la columna date en la base de datos
    expect(rows[0].fecha_limite_str).toBe('2026-03-12');
    expect(rows[1].fecha_limite_str).toBe('2026-03-23');
  });

  it('2. Ciclo de entregables separados: propuesta de riesgo aislada en propuestas_riesgo no colisiona con evaluacion completa', async () => {
    // 1. Crear propuesta de riesgo para la asignación 9901
    await dataSource.query(`
      INSERT INTO evaluacion.propuestas_riesgo (
        asignacion_id, nivel_riesgo_id, observaciones, ronda, es_vigente, fecha_propuesta
      ) VALUES (
        9901, 1, 'Propuesta preliminar de riesgo mínimo', 1, true, NOW()
      );
    `);

    // 2. Verificar que la propuesta de riesgo se encuentra en evaluacion.propuestas_riesgo
    const proposals = await dataSource.query(`
      SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9901 AND es_vigente = true;
    `);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].observaciones).toBe(
      'Propuesta preliminar de riesgo mínimo',
    );

    // 3. Verificar que la asignación 9901 no tiene fecha_entrega_real ni informe_evaluacion aún
    const asgBefore = await dataSource.query(`
      SELECT fecha_entrega_real, informe_evaluacion, ruta_informe_pdf, estado_id 
      FROM evaluacion.asignaciones_evaluacion 
      WHERE id = 9901;
    `);
    expect(asgBefore[0].fecha_entrega_real).toBeNull();
    expect(asgBefore[0].informe_evaluacion).toBeNull();
    expect(asgBefore[0].estado_id).toBe(AssignmentStatus.ASSIGNED);

    // 4. Enviar informe ético completo en la misma asignación
    await dataSource.query(`
      UPDATE evaluacion.asignaciones_evaluacion
      SET fecha_entrega_real = NOW(),
          informe_evaluacion = 'Informe ético completo favorable',
          ruta_informe_pdf = '/storage/informe-9901.pdf',
          estado_id = ${AssignmentStatus.COMPLETED}
      WHERE id = 9901;
    `);

    // 5. Verificar que el informe ético se guardó y la propuesta de riesgo permanece intacta
    const asgAfter = await dataSource.query(`
      SELECT fecha_entrega_real, informe_evaluacion, ruta_informe_pdf, estado_id 
      FROM evaluacion.asignaciones_evaluacion 
      WHERE id = 9901;
    `);
    expect(asgAfter[0].informe_evaluacion).toBe(
      'Informe ético completo favorable',
    );
    expect(asgAfter[0].estado_id).toBe(AssignmentStatus.COMPLETED);

    const proposalsAfter = await dataSource.query(`
      SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9901 AND es_vigente = true;
    `);
    expect(proposalsAfter).toHaveLength(1);
    expect(proposalsAfter[0].observaciones).toBe(
      'Propuesta preliminar de riesgo mínimo',
    );
  });

  it('3. Concurrencia real con Promise.all: dos pares envían propuesta de riesgo simultáneamente a PostgreSQL', async () => {
    // Preparar versión 9998 y asignaciones 9911 y 9912
    await dataSource.query(`
      DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (9911, 9912);
      DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9998;
      DELETE FROM public.versiones_protocolo WHERE id = 9998;
      DELETE FROM public.protocolos WHERE id = 998;

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id)
      VALUES (998, 'Protocolo de Concurrencia Real', 901, 10);

      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (9998, 998, 1, 10);

      INSERT INTO evaluacion.asignaciones_evaluacion (
        id, version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_asignacion
      ) VALUES 
        (9911, 9998, 901, ${AssignmentStatus.ASSIGNED}, true, NOW()),
        (9912, 9998, 902, ${AssignmentStatus.ASSIGNED}, true, NOW());
    `);

    // Función que simula la transacción atómica de submitPeerRiskLevel con bloqueo pesimista
    const submitRiskInTx = async (
      assignmentId: number,
      evaluatorId: number,
      riskLevelId: number,
      obs: string,
    ) => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. Bloqueo pesimista con ORDER BY
        await queryRunner.query(
          `SELECT * FROM evaluacion.asignaciones_evaluacion 
           WHERE version_id = 9998 AND es_asignado_anexo_10 = true 
           ORDER BY id ASC FOR UPDATE`,
        );

        // 2. Insertar propuesta de riesgo
        await queryRunner.query(
          `INSERT INTO evaluacion.propuestas_riesgo (
             asignacion_id, nivel_riesgo_id, observaciones, ronda, es_vigente, fecha_propuesta
           ) VALUES ($1, $2, $3, 1, true, NOW())`,
          [assignmentId, riskLevelId, obs],
        );

        // 3. Verificar si ambos ya tienen propuesta vigente
        const proposals = await queryRunner.query(
          `SELECT pr.* FROM evaluacion.propuestas_riesgo pr
           INNER JOIN evaluacion.asignaciones_evaluacion asg ON pr.asignacion_id = asg.id
           WHERE asg.version_id = 9998 AND pr.es_vigente = true`,
        );

        if (proposals.length === 2) {
          const p1 = proposals[0];
          const p2 = proposals[1];
          if (p1.nivel_riesgo_id === p2.nivel_riesgo_id) {
            await queryRunner.query(
              `UPDATE public.protocolos 
               SET estado_id = 13, nivel_riesgo_id = $1 
               WHERE id = 998`,
              [p1.nivel_riesgo_id],
            );
          } else {
            await queryRunner.query(
              `UPDATE public.protocolos SET estado_id = 16 WHERE id = 998`,
            );
          }
        }

        await queryRunner.commitTransaction();
        return { success: true };
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    };

    // Ejecutar ambas transacciones en paralelo real (Promise.all)
    const [res1, res2] = await Promise.all([
      submitRiskInTx(9911, 901, 1, 'Propuesta Par 1'),
      submitRiskInTx(9912, 902, 1, 'Propuesta Par 2'),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    // Verificaciones SQL reales en PostgreSQL:
    // (a) Exactamente 1 propuesta vigente por cada asignación
    const proposals9911 = await dataSource.query(`
      SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9911 AND es_vigente = true;
    `);
    const proposals9912 = await dataSource.query(`
      SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9912 AND es_vigente = true;
    `);
    expect(proposals9911).toHaveLength(1);
    expect(proposals9912).toHaveLength(1);

    // (b) Estado final consolidado del protocolo = 13 (EN EVALUACION), nivel_riesgo_id = 1
    const protocolRows = await dataSource.query(`
      SELECT id, estado_id, nivel_riesgo_id FROM public.protocolos WHERE id = 998;
    `);
    expect(protocolRows).toHaveLength(1);
    expect(protocolRows[0].estado_id).toBe(13);
    expect(protocolRows[0].nivel_riesgo_id).toBe(1);

    // Cleanup
    await dataSource.query(`
      DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (9911, 9912);
      DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 9998;
      DELETE FROM public.versiones_protocolo WHERE id = 9998;
      DELETE FROM public.protocolos WHERE id = 998;
    `);
  });
});
