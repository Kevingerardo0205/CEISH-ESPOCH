import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { requireEnv } from '../utils/require-env';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    // Se espera una clave de 32 bytes codificada en base64 en ENCRYPTION_KEY.
    const keyBase64 = requireEnv('ENCRYPTION_KEY');
    this.key = Buffer.from(keyBase64, 'base64');

    if (this.key.length !== 32) {
      throw new Error(
        `[startup] ENCRYPTION_KEY debe decodificar a exactamente 32 bytes (AES-256). ` +
          `Longitud actual: ${this.key.length} bytes.`,
      );
    }
  }

  encrypt(text: string | null): string | null {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return `${iv.toString('base64')}:${encrypted}`;
  }

  decrypt(encryptedData: string | null): string | null {
    if (!encryptedData) return null;
    try {
      const [ivBase64, encrypted] = encryptedData.split(':');
      if (!ivBase64 || !encrypted) return encryptedData; // Retornar tal cual si no tiene el formato esperado

      const iv = Buffer.from(ivBase64, 'base64');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // Si falla la desencriptación (ej. dato no encriptado), devolver original
      return encryptedData;
    }
  }
}
