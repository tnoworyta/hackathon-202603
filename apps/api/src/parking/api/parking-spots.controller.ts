import { Body, Controller, Delete, Param, Patch } from "@nestjs/common";
import { Validate } from "nestjs-typebox";
import { BaseResponse, baseResponse, nullResponse, UUIDSchema } from "src/common";
import { Session, UserSession } from "src/auth";
import { ParkingService } from "../parking.service";
import {
  parkingSpotSchema,
  updateParkingSpotSchema,
  type UpdateParkingSpotBody,
} from "../schemas/parking-spot.schema";

@Controller({
  path: "parking-spots",
  version: "1",
})
export class ParkingSpotsController {
  constructor(private readonly parkingService: ParkingService) {}

  @Patch(":id")
  @Validate({
    request: [
      { type: "param", name: "id", schema: UUIDSchema },
      { type: "body", schema: updateParkingSpotSchema },
    ],
    response: baseResponse(parkingSpotSchema),
  })
  async updateSpot(
    @Param("id") id: string,
    @Body() data: UpdateParkingSpotBody,
    @Session() session: UserSession,
  ) {
    const spot = await this.parkingService.updateSpot(
      session.user.role,
      id,
      data,
    );
    return new BaseResponse(spot);
  }

  @Delete(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: nullResponse(),
  })
  async deleteSpot(@Param("id") id: string, @Session() session: UserSession) {
    await this.parkingService.deleteSpot(session.user.role, id);
    return null;
  }
}
