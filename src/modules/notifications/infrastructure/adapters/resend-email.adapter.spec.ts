import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendEmailAdapter } from './resend-email.adapter';

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
});
