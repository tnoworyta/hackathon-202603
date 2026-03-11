import { Static, Type } from "@sinclair/typebox";
import { UUIDSchema } from "src/common";

export const parkingPlaceSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String(),
  address: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const parkingPlacesSchema = Type.Array(parkingPlaceSchema);

export const createParkingPlaceSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  address: Type.Optional(Type.String()),
});

export const updateParkingPlaceSchema = Type.Partial(createParkingPlaceSchema);

export type ParkingPlaceResponse = Static<typeof parkingPlaceSchema>;
export type ParkingPlacesResponse = Static<typeof parkingPlacesSchema>;
export type CreateParkingPlaceBody = Static<typeof createParkingPlaceSchema>;
export type UpdateParkingPlaceBody = Static<typeof updateParkingPlaceSchema>;
