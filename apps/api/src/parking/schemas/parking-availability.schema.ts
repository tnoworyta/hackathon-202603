import { Static, Type } from "@sinclair/typebox";
import { UUIDSchema } from "src/common";

export const parkingSpotAvailabilitySchema = Type.Object({
  id: UUIDSchema,
  label: Type.String(),
  isActive: Type.Boolean(),
  available: Type.Boolean(),
});

export const parkingAvailabilitySchema = Type.Array(
  parkingSpotAvailabilitySchema,
);

export type ParkingSpotAvailabilityResponse = Static<
  typeof parkingSpotAvailabilitySchema
>;
export type ParkingAvailabilityResponse = Static<typeof parkingAvailabilitySchema>;
