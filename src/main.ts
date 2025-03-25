import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as firebaseAdmin from 'firebase-admin';
// import * as fs from 'fs';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const client = new SecretManagerServiceClient();

  const config = new DocumentBuilder()
    .setTitle('User Authentication')
    .setDescription(
      'The API details for the User Authentication Demo application using Firebase in the NestJS backend.',
    )
    .setVersion('1.0')
    .addTag('Authentication')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);

  Logger.debug(`Server running on ${await app.getUrl()}/api`);
  Logger.verbose(`Server running on ${await app.getUrl()}/api/docs`);
  Logger.verbose(`Confirm server health on ${await app.getUrl()}/api/health`);

  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/667270001960/secrets/firebase-auth-pk/versions/1`,
    });
    const secretPayload = version.payload?.data?.toString();
    if (!secretPayload) {
      throw new Error('Secret payload is empty.');
    }
    const serviceAccount = JSON.parse(secretPayload);

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
      // storageBucket: 'invoicing-c93a9.appspot.com',
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}
bootstrap();
