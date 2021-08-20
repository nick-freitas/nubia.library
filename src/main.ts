import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'library',
          brokers: ['kafka-service:9092'],
        },
        consumer: {
          groupId: 'library-consumer',
        },
      },
    },
  );

  app.listen();
}

bootstrap();
