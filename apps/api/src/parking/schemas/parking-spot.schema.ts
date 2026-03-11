import { Static, Type } from "@sinclair/typebox";
import { UUIDSchema } from "src/common";

export const parkingSpotSchema = Type.Object({
  id: UUIDSchema,
  placeId: UUIDSchema,
  label: Type.String(),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const parkingSpotsSchema = Type.Array(parkingSpotSchema);

export const createParkingSpotSchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  isActive: Type.Optional(Type.Boolean()),
});

export const updateParkingSpotSchema = Type.Partial(createParkingSpotSchema);

export type ParkingSpotResponse = Static<typeof parkingSpotSchema>;
export type ParkingSpotsResponse = Static<typeof parkingSpotsSchema>;
export type CreateParkingSpotBody = Static<typeof createParkingSpotSchema>;
export type UpdateParkingSpotBody = Static<typeof updateParkingSpotSchema>;
