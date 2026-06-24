import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from '../../domain/ports/storage.service.port';

@Injectable()
export class S3StorageAdapter implements IStorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3StorageAdapter.name);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '';
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    this.bucketName =
      this.configService.get<string>('S3_BUCKET') || 'ceish-bucket';
    const region = this.configService.get<string>('S3_REGION', 'auto');
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true';

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      region,
      forcePathStyle,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    this.logger.log(
      `Storage adapter S3 initialized (Bucket: ${this.bucketName})`,
    );
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
  }

  async getDownloadUrl(key: string, expiresSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });
    await this.s3Client.send(command);
  }

  async getMetadata(key: string): Promise<any> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
  }
}
