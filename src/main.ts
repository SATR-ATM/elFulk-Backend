import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
    .setTitle('elFulk API Documentation')
    .setDescription('API Documentation for the elFulk project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/doc', app, document);

  await app.get(AdminService).ensureSuperAdminExists();
  await app.listen(3000);
}
void bootstrap();
