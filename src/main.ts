import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // const context = await NestFactory.createApplicationContext(AppModule);
  // try {
  //   await PriorityMigration.run(context);
  //   console.log('Migration complete ✅');
  // } catch (error) {
  //   console.error('Migration failed:', error);
  // } finally {
  //   await context.close();
  // }
  
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  await app.listen(process.env.PORT ?? 3003);
  console.log(`🚀 App server is running on port ${process.env.PORT ?? 3003}`);
}
bootstrap();
