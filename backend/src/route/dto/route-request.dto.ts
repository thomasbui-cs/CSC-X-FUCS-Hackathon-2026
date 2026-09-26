import { ArrayMinSize, ArrayMaxSize, IsArray, IsNumber, IsOptional } from 'class-validator';

export type LonLat = [number, number];

export class RouteRequestDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  from: LonLat;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  to: LonLat;

  @IsOptional()
  @IsArray()
  polygons?: LonLat[][][];
}
