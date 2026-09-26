import { Body, Controller, Post } from '@nestjs/common';
import { RouteRequestDto } from './dto/route-request.dto';
import { RouteService, WalkRoute } from './route.service';

@Controller('api/route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  getRoute(@Body() dto: RouteRequestDto): Promise<WalkRoute> {
    return this.routeService.getRoute(dto);
  }
}
