import { Static, Type } from "@sinclair/typebox";
import { UUIDSchema } from "src/common";

export const parkingReservationSchema = Type.Object({
  id: UUIDSchema,
  spotId: UUIDSchema,
  userId: Type.String(),
  startDate: Type.String({ format: "date" }),
  endDate: Type.String({ format: "date" }),
  status: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const parkingReservationDetailsSchema = Type.Object({
  ...parkingReservationSchema.properties,
  spotLabel: Type.String(),
  placeId: UUIDSchema,
  placeName: Type.String(),
});

export const parkingReservationsSchema = Type.Array(
  parkingReservationDetailsSchema,
);

export const createParkingReservationSchema = Type.Object({
  spotId: UUIDSchema,
  startDate: Type.String({ format: "date" }),
  endDate: Type.String({ format: "date" }),
});

export type ParkingReservationResponse = Static<typeof parkingReservationSchema>;
export type ParkingReservationDetailsResponse = Static<
  typeof parkingReservationDetailsSchema
>;
export type ParkingReservationsResponse = Static<typeof parkingReservationsSchema>;
export type CreateParkingReservationBody = Static<
  typeof createParkingReservationSchema
>;
