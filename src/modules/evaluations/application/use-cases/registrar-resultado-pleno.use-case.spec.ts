import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import {
  RegistrarResultadoPlenoDto,
  RESULTADOS_PLENO,
} from '../dtos/registrar-resultado-pleno.dto';
import {
  RegistrarResultadoPlenoInput,
  RegistrarResultadoPlenoUseCase,
} from './registrar-resultado-pleno.use-case';

// Reloj fijo: 24/11/2026 15:00 en Ecuador (UTC-5).
const AHORA = new Date('2026-11-24T15:00:00-05:00');
const CONVOCATORIA_ID = '11111111-1111-4111-8111-111111111111';
const CP_ID = '22222222-2222-4222-8222-222222222222';
const SECRETARIA_ID = 7;

function dto(
  parcial: Partial<RegistrarResultadoPlenoDto>,
): RegistrarResultadoPlenoDto {
  return {
    resultado: 'APROBADO_DEFINITIVO',
    ...parcial,
  };
}

function entrada(
  parcial: Partial<RegistrarResultadoPlenoInput> = {},
): RegistrarResultadoPlenoInput {
  return {
    convocatoriaId: CONVOCATORIA_ID,
    convocatoriaProtocoloId: CP_ID,
    dto: dto({}),
    registradoPor: SECRETARIA_ID,
    now: AHORA,
    ...parcial,
  };
}

describe('TSK-015-N08 — RegistrarResultadoPlenoUseCase (RF-17.1)', () => {
  let repo: {
    findResultadoPlenoContext: jest.Mock;
    registrarResultadoPleno: jest.Mock;
  };
  let useCase: RegistrarResultadoPlenoUseCase;

  /** Contexto por defecto: reunión de hoy, convocatoria PROGRAMADA, sin resultado previo. */
  function conContexto(parcial: Record<string, unknown> = {}): void {
    repo.findResultadoPlenoContext.mockResolvedValue({
      convocatoriaProtocoloId: CP_ID,
      convocatoriaEstado: 'PROGRAMADA',
      fechaReunion: new Date('2026-11-24T10:00:00-05:00'),
      dictamenResultado: null,
      ...parcial,
    });
  }

  beforeEach(() => {
    repo = {
      findResultadoPlenoContext: jest.fn(),
      registrarResultadoPleno: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RegistrarResultadoPlenoUseCase(
      repo as unknown as IMeetingRepositoryPort,
    );
  });

  describe('ventana y pertenencia', () => {
    it('404 si el punto no pertenece a la convocatoria', async () => {
      repo.findResultadoPlenoContext.mockResolvedValue(null);
      await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('409 si la convocatoria está CANCELADA', async () => {
      conContexto({ convocatoriaEstado: 'CANCELADA' });
      await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('409 si fecha_reunion es futura en America/Guayaquil', async () => {
      conContexto({ fechaReunion: new Date('2026-11-25T10:00:00-05:00') });
      await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('409 si fecha_reunion es nula', async () => {
      conContexto({ fechaReunion: null });
      await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('permite la fecha de hoy aunque la hora de la reunión sea posterior a la petición', async () => {
      conContexto({ fechaReunion: new Date('2026-11-24T23:30:00-05:00') });
      await expect(useCase.execute(entrada())).resolves.toBeDefined();
      expect(repo.registrarResultadoPleno).toHaveBeenCalledTimes(1);
    });

    it('compara por día de Ecuador, no UTC: reunión 22:00 del 24 en Ecuador (03:00Z del 25) con petición 18:30 del 24 en Ecuador (23:30Z del 24) se permite', async () => {
      conContexto({ fechaReunion: new Date('2026-11-25T03:00:00Z') });
      await expect(
        useCase.execute(entrada({ now: new Date('2026-11-24T23:30:00Z') })),
      ).resolves.toBeDefined();
      expect(repo.registrarResultadoPleno).toHaveBeenCalledTimes(1);
    });
  });

  describe('validaciones de motivo, observaciones y corrección', () => {
    it('400 NO_APROBADO sin motivo', async () => {
      conContexto();
      await expect(
        useCase.execute(entrada({ dto: dto({ resultado: 'NO_APROBADO' }) })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('400 NO_APROBADO con motivo solo espacios', async () => {
      conContexto();
      await expect(
        useCase.execute(
          entrada({ dto: dto({ resultado: 'NO_APROBADO', motivo: '   ' }) }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 APROBADO_CON_CONDICION sin observaciones', async () => {
      conContexto();
      await expect(
        useCase.execute(
          entrada({ dto: dto({ resultado: 'APROBADO_CON_CONDICION' }) }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('400 corrección (ya hay resultado) sin motivoCorreccion', async () => {
      conContexto({ dictamenResultado: 'APROBADO_DEFINITIVO' });
      await expect(
        useCase.execute(
          entrada({ dto: dto({ resultado: 'NO_APROBADO', motivo: 'x' }) }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.registrarResultadoPleno).not.toHaveBeenCalled();
    });

    it('primer registro: no exige motivoCorreccion y envía resultadoAnterior null', async () => {
      conContexto({ dictamenResultado: null });
      await useCase.execute(entrada());
      expect(repo.registrarResultadoPleno).toHaveBeenCalledWith(
        expect.objectContaining({
          convocatoriaProtocoloId: CP_ID,
          resultadoAnterior: null,
          resultado: 'APROBADO_DEFINITIVO',
          motivoCorreccion: null,
          registradoPor: SECRETARIA_ID,
        }),
      );
    });

    it('corrección con motivoCorreccion: envía el valor anterior y el motivo', async () => {
      conContexto({ dictamenResultado: 'APROBADO_DEFINITIVO' });
      await useCase.execute(
        entrada({
          dto: dto({
            resultado: 'APROBADO_CON_CONDICION',
            observaciones: 'Subsanar el consentimiento',
            motivoCorreccion: 'Error de transcripción del acta',
          }),
        }),
      );
      expect(repo.registrarResultadoPleno).toHaveBeenCalledWith(
        expect.objectContaining({
          resultadoAnterior: 'APROBADO_DEFINITIVO',
          resultado: 'APROBADO_CON_CONDICION',
          observaciones: 'Subsanar el consentimiento',
          motivoCorreccion: 'Error de transcripción del acta',
        }),
      );
    });

    it('recorta los textos antes de guardarlos', async () => {
      conContexto();
      await useCase.execute(
        entrada({
          dto: dto({ resultado: 'NO_APROBADO', motivo: '  Falta firma  ' }),
        }),
      );
      expect(repo.registrarResultadoPleno).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: 'Falta firma' }),
      );
    });

    it('no cambia protocolos.estado_id: el registro no recibe ningún estado', async () => {
      conContexto();
      await useCase.execute(entrada());
      const llamadas = repo.registrarResultadoPleno.mock.calls as unknown[][];
      const params = llamadas[0][0] as Record<string, unknown>;
      expect(Object.keys(params)).not.toEqual(
        expect.arrayContaining(['estadoId', 'estado', 'protocoloEstadoId']),
      );
    });
  });

  describe('RegistrarResultadoPlenoDto (valores y longitud)', () => {
    async function errores(obj: Record<string, unknown>): Promise<string[]> {
      const instancia = plainToInstance(RegistrarResultadoPlenoDto, obj);
      const res = await validate(instancia);
      return res.map((e) => e.property);
    }

    it('acepta los tres resultados del pleno', async () => {
      for (const resultado of RESULTADOS_PLENO) {
        expect(await errores({ resultado })).toEqual([]);
      }
    });

    it('rechaza SUSPENDIDO y otros valores (no es resultado del pleno)', async () => {
      expect(await errores({ resultado: 'SUSPENDIDO' })).toEqual(['resultado']);
      expect(await errores({ resultado: 'APROBADO' })).toEqual(['resultado']);
    });

    it('rechaza motivo, observaciones o motivoCorreccion que no sean texto o superen 2000', async () => {
      expect(await errores({ resultado: 'NO_APROBADO', motivo: 5 })).toEqual([
        'motivo',
      ]);
      expect(
        await errores({
          resultado: 'APROBADO_CON_CONDICION',
          observaciones: 'x'.repeat(2001),
        }),
      ).toEqual(['observaciones']);
      expect(
        await errores({
          resultado: 'APROBADO_DEFINITIVO',
          motivoCorreccion: 'x'.repeat(2001),
        }),
      ).toEqual(['motivoCorreccion']);
    });
  });
});
