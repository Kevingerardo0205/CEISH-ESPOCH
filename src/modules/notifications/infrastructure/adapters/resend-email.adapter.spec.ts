import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ResendEmailAdapter } from './resend-email.adapter';
import appConfig from '../../../../config/app.config';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn() },
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Resend } = require('resend') as { Resend: jest.Mock };

function makeAdapter(emailEnabled = true): {
  adapter: ResendEmailAdapter;
  mockSend: jest.Mock;
} {
  const mockSend = jest.fn();
  Resend.mockImplementation(() => ({ emails: { send: mockSend } }));

  const configService = {
    get: jest.fn((key: string, defaultVal?: unknown) => {
      if (key === 'RESEND_API_KEY') return 'test-key';
      if (key === 'EMAIL_FROM') return 'noreply@test.com';
      if (key === 'FRONTEND_URL') return 'https://localhost:4200';
      if (key === 'app.emailEnabled') return emailEnabled;
      return defaultVal;
    }),
  } as unknown as ConfigService;

  return { adapter: new ResendEmailAdapter(configService), mockSend };
}

describe('ResendEmailAdapter (TSK-002-N18, TSK-002-N20)', () => {
  afterEach(() => jest.restoreAllMocks());

  // ─── N18: inspección de result.error ────────────────────────────────────────

  describe('N18 — sendEvaluationAssignment lanza cuando Resend devuelve error', () => {
    it('lanza excepción con el mensaje del error cuando result.error != null', async () => {
      const { adapter, mockSend } = makeAdapter();
      mockSend.mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid API key',
          name: 'invalid_api_key',
          statusCode: 401,
        },
      });

      await expect(
        adapter.sendEvaluationAssignment(
          'eval@test.com',
          'Dr. Test',
          'CEISH-001',
          null,
        ),
      ).rejects.toThrow('Invalid API key');
    });

    it('no lanza cuando result.error es null y logea el id', async () => {
      const { adapter, mockSend } = makeAdapter();
      mockSend.mockResolvedValue({ data: { id: 'msg-abc' }, error: null });
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await expect(
        adapter.sendEvaluationAssignment(
          'eval@test.com',
          'Dr. Test',
          'CEISH-001',
          null,
        ),
      ).resolves.toBeUndefined();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('msg-abc'));
    });
  });

  describe('N18 — otros métodos: Logger.error sin lanzar cuando result.error != null', () => {
    it('sendPasswordReset NO lanza, registra Logger.error con mensaje y statusCode', async () => {
      const { adapter, mockSend } = makeAdapter();
      mockSend.mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized',
          name: 'unauthorized',
          statusCode: 401,
        },
      });
      const errSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      await expect(
        adapter.sendPasswordReset('user@test.com', '123456', 'Dr. Test'),
      ).resolves.toBeUndefined();

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unauthorized'),
      );
      expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('401'));
    });

    it('sendPasswordReset registra éxito con el id cuando result.error es null', async () => {
      const { adapter, mockSend } = makeAdapter();
      mockSend.mockResolvedValue({ data: { id: 'msg-pw-123' }, error: null });
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await adapter.sendPasswordReset('user@test.com', '123456', 'Dr. Test');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('msg-pw-123'),
      );
    });
  });

  // ─── N20: EMAIL_ENABLED ──────────────────────────────────────────────────────

  describe('N20 — EMAIL_ENABLED=false: dry-run sin llamar al SDK', () => {
    it('con EMAIL_ENABLED=false el SDK NO se llama y Logger.log registra dry-run con destinatario y asunto', async () => {
      const { adapter, mockSend } = makeAdapter(false);
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await adapter.sendPasswordReset('user@test.com', '123456', 'Dr. Test');

      expect(mockSend).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('dry-run'));
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@test.com'),
      );
    });

    it('sendEvaluationAssignment con EMAIL_ENABLED=false también hace dry-run', async () => {
      const { adapter, mockSend } = makeAdapter(false);
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await adapter.sendEvaluationAssignment(
        'eval@test.com',
        'Dr. Test',
        'CEISH-001',
        null,
      );

      expect(mockSend).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('dry-run'));
    });
  });

  describe('N20 — EMAIL_ENABLED ausente o true: envío normal', () => {
    it('con EMAIL_ENABLED=true el SDK se llama', async () => {
      const { adapter, mockSend } = makeAdapter(true);
      mockSend.mockResolvedValue({ data: { id: 'msg-001' }, error: null });

      await adapter.sendPasswordReset('user@test.com', '123456', 'Dr. Test');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('con emailEnabled=undefined (ausente) el SDK se llama (habilitado por defecto)', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'msg-002' }, error: null });
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }));
      const configService = {
        get: jest.fn((key: string, defaultVal?: unknown) => {
          if (key === 'RESEND_API_KEY') return 'test-key';
          if (key === 'EMAIL_FROM') return 'noreply@test.com';
          if (key === 'FRONTEND_URL') return 'https://localhost:4200';
          if (key === 'app.emailEnabled') return undefined;
          return defaultVal;
        }),
      } as unknown as ConfigService;
      const adapter = new ResendEmailAdapter(configService);

      await adapter.sendPasswordReset('user@test.com', '123456', 'Dr. Test');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  // ─── N20: prueba de integración con ConfigModule real ──────────────────────────
  // Demuestra que configService.get('app.emailEnabled') resuelve la clave correcta.
  // Si se usara la clave incorrecta ('emailEnabled' sin prefijo), get() devolvería
  // undefined → ?? true → emailEnabled=true → SDK sería llamado → el primer it
  // fallaría en expect(mockSend).not.toHaveBeenCalled(). Esa sería la evidencia de ROJO.

  describe('N20 — integración ConfigModule real: clave app.emailEnabled', () => {
    const savedEnv: Record<string, string | undefined> = {};
    const MANAGED_VARS = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY',
      'RESEND_API_KEY',
      'EMAIL_FROM',
      'FRONTEND_URL',
      'EMAIL_ENABLED',
    ];

    beforeEach(() => {
      for (const k of MANAGED_VARS) savedEnv[k] = process.env[k];
      process.env.JWT_SECRET = 'fake-jwt-secret-for-integration-test';
      process.env.JWT_REFRESH_SECRET = 'fake-refresh-secret-for-test-xx';
      process.env.ENCRYPTION_KEY = 'fake-encryption-key-for-test-xxx';
      process.env.RESEND_API_KEY = 're_fake_key_integration';
      process.env.EMAIL_FROM = 'noreply@test.com';
      process.env.FRONTEND_URL = 'http://localhost:4200';
    });

    afterEach(() => {
      for (const k of MANAGED_VARS) {
        if (savedEnv[k] === undefined) delete process.env[k];
        else process.env[k] = savedEnv[k];
      }
    });

    it('EMAIL_ENABLED=false → dry-run sin llamar al SDK', async () => {
      process.env.EMAIL_ENABLED = 'false';
      const mockSend = jest.fn();
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }));

      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ load: [appConfig], ignoreEnvFile: true }),
        ],
        providers: [ResendEmailAdapter],
      }).compile();

      const adapter = module.get(ResendEmailAdapter);
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await adapter.sendPasswordReset(
        'test@ceish.ec',
        '123456',
        'Evaluador Test',
      );

      expect(mockSend).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('dry-run'));
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@ceish.ec'),
      );

      await module.close();
    });

    it('EMAIL_ENABLED ausente → SDK se llama (habilitado por defecto)', async () => {
      delete process.env.EMAIL_ENABLED;
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'msg-int-001' }, error: null });
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }));

      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ load: [appConfig], ignoreEnvFile: true }),
        ],
        providers: [ResendEmailAdapter],
      }).compile();

      const adapter = module.get(ResendEmailAdapter);
      jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

      await adapter.sendPasswordReset(
        'test@ceish.ec',
        '123456',
        'Evaluador Test',
      );

      expect(mockSend).toHaveBeenCalledTimes(1);

      await module.close();
    });
  });
});
