import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { Validate } from "nestjs-typebox";
import { BaseResponse, baseResponse, nullResponse, UUIDSchema } from "src/common";
import { Session, UserSession } from "src/auth";
import { ParkingService } from "../parking.service";
import {
  createParkingReservationSchema,
  parkingReservationSchema,
  parkingReservationsSchema,
  type CreateParkingReservationBody,
} from "../schemas/parking-reservation.schema";

@Controller({
  path: "parking-reservations",
  version: "1",
})
export class ParkingReservationsController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get()
  @Validate({
    response: baseResponse(parkingReservationsSchema),
  })
  async listReservations(
    @Session() session: UserSession,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("placeId") placeId?: string,
  ) {
    const reservations = await this.parkingService.listReservations({
      userId: session.user.id,
      role: session.user.role,
      from,
      to,
      placeId,
    });

    return new BaseResponse(reservations);
  }

  @Post()
  @Validate({
    request: [{ type: "body", schema: createParkingReservationSchema }],
    response: baseResponse(parkingReservationSchema),
  })
  async createReservation(
    @Body() data: CreateParkingReservationBody,
    @Session() session: UserSession,
  ) {
    const reservation = await this.parkingService.createReservation(
      session.user.id,
      data,
    );
    return new BaseResponse(reservation);
  }

  @Delete(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: nullResponse(),
  })
  async cancelReservation(
    @Param("id") id: string,
    @Session() session: UserSession,
  ) {
    await this.parkingService.cancelReservation({
      reservationId: id,
      userId: session.user.id,
      role: session.user.role,
    });

    return null;
  }
}
