import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { GlobalValidationPipe } from './shared/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Confiar en el primer proxy para obtener IP real del cliente (Docker/nginx)
  // Necesario para que DosDefenseMiddleware extraiga correctamente req.ip
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('CEISH-ESPOCH API')
    .setDescription(
      'Documentación de la API para el Comité de Ética en Investigación de Seres Humanos (CEISH) - ESPOCH',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new GlobalValidationPipe());

  await app.listen(process.env.PORT ?? 3002);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3002}/api`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3002}/docs`,
  );
}
bootstrap();
