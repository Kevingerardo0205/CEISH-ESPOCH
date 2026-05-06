import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { GlobalValidationPipe } from './shared/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('CEISH-ESPOCH API')
    .setDescription('Documentación de la API para el Comité de Ética en Investigación de Seres Humanos (CEISH) - ESPOCH')
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
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3002}/api`);
  console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 3002}/docs`);
}
bootstrap();
