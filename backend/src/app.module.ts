import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouteModule } from './route/route.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RouteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
