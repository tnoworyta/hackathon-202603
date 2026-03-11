import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Validate } from "nestjs-typebox";
import {
  BaseResponse,
  baseResponse,
  nullResponse,
  UUIDSchema,
} from "src/common";
import { Session, UserSession } from "src/auth";
import { ParkingService } from "../parking.service";
import {
  createParkingPlaceSchema,
  parkingPlaceSchema,
  parkingPlacesSchema,
  updateParkingPlaceSchema,
  type CreateParkingPlaceBody,
  type UpdateParkingPlaceBody,
} from "../schemas/parking-place.schema";
import {
  createParkingSpotSchema,
  parkingSpotSchema,
  parkingSpotsSchema,
  type CreateParkingSpotBody,
} from "../schemas/parking-spot.schema";
import {
  parkingAvailabilitySchema,
  type ParkingAvailabilityResponse,
} from "../schemas/parking-availability.schema";

@Controller({
  path: "parking-places",
  version: "1",
})
export class ParkingPlacesController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get()
  @Validate({
    response: baseResponse(parkingPlacesSchema),
  })
  async listPlaces() {
    const places = await this.parkingService.listPlaces();
    return new BaseResponse(places);
  }

  @Get(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(parkingPlaceSchema),
  })
  async getPlace(@Param("id") id: string) {
    const place = await this.parkingService.getPlaceById(id);
    return new BaseResponse(place);
  }

  @Post()
  @Validate({
    request: [{ type: "body", schema: createParkingPlaceSchema }],
    response: baseResponse(parkingPlaceSchema),
  })
  async createPlace(
    @Body() data: CreateParkingPlaceBody,
    @Session() session: UserSession,
  ) {
    const place = await this.parkingService.createPlace(
      session.user.role,
      data,
    );
    return new BaseResponse(place);
  }

  @Patch(":id")
  @Validate({
    request: [
      { type: "param", name: "id", schema: UUIDSchema },
      { type: "body", schema: updateParkingPlaceSchema },
    ],
    response: baseResponse(parkingPlaceSchema),
  })
  async updatePlace(
    @Param("id") id: string,
    @Body() data: UpdateParkingPlaceBody,
    @Session() session: UserSession,
  ) {
    const place = await this.parkingService.updatePlace(
      session.user.role,
      id,
      data,
    );
    return new BaseResponse(place);
  }

  @Delete(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: nullResponse(),
  })
  async deletePlace(
    @Param("id") id: string,
    @Session() session: UserSession,
  ) {
    await this.parkingService.deletePlace(session.user.role, id);
    return null;
  }

  @Get(":id/spots")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(parkingSpotsSchema),
  })
  async listSpots(@Param("id") id: string) {
    const spots = await this.parkingService.listSpots(id);
    return new BaseResponse(spots);
  }

  @Post(":id/spots")
  @Validate({
    request: [
      { type: "param", name: "id", schema: UUIDSchema },
      { type: "body", schema: createParkingSpotSchema },
    ],
    response: baseResponse(parkingSpotSchema),
  })
  async createSpot(
    @Param("id") id: string,
    @Body() data: CreateParkingSpotBody,
    @Session() session: UserSession,
  ) {
    const spot = await this.parkingService.createSpot(
      session.user.role,
      id,
      data,
    );
    return new BaseResponse(spot);
  }

  @Get(":id/availability")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(parkingAvailabilitySchema),
  })
  async getAvailability(
    @Param("id") id: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ): Promise<BaseResponse<ParkingAvailabilityResponse>> {
    if (!from || !to) {
      throw new BadRequestException(
        "Both 'from' and 'to' query params are required",
      );
    }

    const availability = await this.parkingService.getAvailability(id, from, to);
    return new BaseResponse(availability);
  }
}
