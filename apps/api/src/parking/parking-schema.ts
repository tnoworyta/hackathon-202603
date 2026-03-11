import { pgTable, text, boolean, date, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "src/storage/schema/utils";
import { user } from "src/auth/auth-schema";

export const parkingPlace = pgTable("parking_place", {
  ...id,
  name: text("name").notNull(),
  address: text("address"),
  ...timestamps,
});

export const parkingSpot = pgTable("parking_spot", {
  ...id,
  placeId: uuid("place_id")
    .notNull()
    .references(() => parkingPlace.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const parkingReservation = pgTable("parking_reservation", {
  ...id,
  spotId: uuid("spot_id")
    .notNull()
    .references(() => parkingSpot.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  status: text("status").default("active").notNull(),
  ...timestamps,
});
