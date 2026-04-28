import { Injectable, ValidationPipe } from '@nestjs/common';

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  }
}
