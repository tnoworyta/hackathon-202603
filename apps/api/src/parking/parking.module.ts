import { Module } from "@nestjs/common";
import { ParkingService } from "./parking.service";
import { ParkingPlacesController } from "./api/parking-places.controller";
import { ParkingSpotsController } from "./api/parking-spots.controller";
import { ParkingReservationsController } from "./api/parking-reservations.controller";

@Module({
  controllers: [
    ParkingPlacesController,
    ParkingSpotsController,
    ParkingReservationsController,
  ],
  providers: [ParkingService],
})
export class ParkingModule {}
