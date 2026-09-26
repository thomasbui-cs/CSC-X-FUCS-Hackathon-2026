import { PlacesController } from './places.controller';
import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';

@Module({
  controllers: [RouteController, PlacesController],
  providers: [RouteService],
})
export class RouteModule {}
