import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './modules/admin/admin.service';
import { dataSource } from './typeorm/data-source';

async function bootstrap() {
  await dataSource.initialize();
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('ElFulk API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/doc', app, document);

  await app.get(AdminService).ensureSuperAdminExists();

  await app.listen(3000);
}

void bootstrap();