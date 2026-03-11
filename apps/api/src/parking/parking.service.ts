import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { DatabasePg } from "src/common";
import {
  parkingPlace,
  parkingReservation,
  parkingSpot,
} from "src/storage/schema";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(date: string) {
  if (!DATE_REGEX.test(date)) {
    throw new BadRequestException("Invalid date format (expected YYYY-MM-DD)");
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException("Invalid date value");
  }

  return parsed;
}

function toUtcDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function ensureDateRange(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start > end) {
    throw new BadRequestException("Start date must be before or equal to end date");
  }

  const todayUtc = toUtcDate(new Date());
  const maxUtc = addDays(todayUtc, 14);

  if (start < todayUtc || end > maxUtc) {
    throw new BadRequestException(
      "Reservations must be within the next two weeks",
    );
  }

  return { start, end };
}

@Injectable()
export class ParkingService {
  constructor(@Inject("DB") private readonly db: DatabasePg) {}

  private ensureAdmin(role?: string | null) {
    if (role !== "admin") {
      throw new ForbiddenException("Admin permissions required");
    }
  }

  private async ensurePlace(placeId: string) {
    const [place] = await this.db
      .select({ id: parkingPlace.id })
      .from(parkingPlace)
      .where(eq(parkingPlace.id, placeId));

    if (!place) {
      throw new NotFoundException("Parking place not found");
    }
  }

  private async ensureSpot(spotId: string) {
    const [spot] = await this.db
      .select({ id: parkingSpot.id, isActive: parkingSpot.isActive })
      .from(parkingSpot)
      .where(eq(parkingSpot.id, spotId));

    if (!spot) {
      throw new NotFoundException("Parking spot not found");
    }

    return spot;
  }

  async listPlaces() {
    return this.db.select().from(parkingPlace);
  }

  async getPlaceById(placeId: string) {
    const [place] = await this.db
      .select()
      .from(parkingPlace)
      .where(eq(parkingPlace.id, placeId));

    if (!place) {
      throw new NotFoundException("Parking place not found");
    }

    return place;
  }

  async createPlace(role: string | null | undefined, data: {
    name: string;
    address?: string;
  }) {
    this.ensureAdmin(role);

    const [created] = await this.db
      .insert(parkingPlace)
      .values({
        name: data.name,
        address: data.address ?? null,
      })
      .returning();

    return created;
  }

  async updatePlace(
    role: string | null | undefined,
    placeId: string,
    data: { name?: string; address?: string },
  ) {
    this.ensureAdmin(role);
    await this.ensurePlace(placeId);

    const [updated] = await this.db
      .update(parkingPlace)
      .set({
        ...(data.name ? { name: data.name } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
      })
      .where(eq(parkingPlace.id, placeId))
      .returning();

    return updated;
  }

  async deletePlace(role: string | null | undefined, placeId: string) {
    this.ensureAdmin(role);

    const [deleted] = await this.db
      .delete(parkingPlace)
      .where(eq(parkingPlace.id, placeId))
      .returning();

    if (!deleted) {
      throw new NotFoundException("Parking place not found");
    }
  }

  async listSpots(placeId: string) {
    await this.ensurePlace(placeId);

    return this.db
      .select()
      .from(parkingSpot)
      .where(eq(parkingSpot.placeId, placeId));
  }

  async createSpot(
    role: string | null | undefined,
    placeId: string,
    data: { label: string; isActive?: boolean },
  ) {
    this.ensureAdmin(role);
    await this.ensurePlace(placeId);

    const [created] = await this.db
      .insert(parkingSpot)
      .values({
        placeId,
        label: data.label,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateSpot(
    role: string | null | undefined,
    spotId: string,
    data: { label?: string; isActive?: boolean },
  ) {
    this.ensureAdmin(role);
    await this.ensureSpot(spotId);

    const [updated] = await this.db
      .update(parkingSpot)
      .set({
        ...(data.label ? { label: data.label } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      })
      .where(eq(parkingSpot.id, spotId))
      .returning();

    return updated;
  }

  async deleteSpot(role: string | null | undefined, spotId: string) {
    this.ensureAdmin(role);

    const [deleted] = await this.db
      .delete(parkingSpot)
      .where(eq(parkingSpot.id, spotId))
      .returning();

    if (!deleted) {
      throw new NotFoundException("Parking spot not found");
    }
  }

  async getAvailability(placeId: string, from: string, to: string) {
    await this.ensurePlace(placeId);
    ensureDateRange(from, to);

    const spots = await this.db
      .select({
        id: parkingSpot.id,
        label: parkingSpot.label,
        isActive: parkingSpot.isActive,
      })
      .from(parkingSpot)
      .where(eq(parkingSpot.placeId, placeId));

    if (!spots.length) {
      return [];
    }

    const spotIds = spots.map((spot) => spot.id);

    const reservations = await this.db
      .select({
        spotId: parkingReservation.spotId,
      })
      .from(parkingReservation)
      .where(
        and(
          inArray(parkingReservation.spotId, spotIds),
          eq(parkingReservation.status, "active"),
          lte(parkingReservation.startDate, to),
          gte(parkingReservation.endDate, from),
        ),
      );

    const reservedIds = new Set(reservations.map((item) => item.spotId));

    return spots.map((spot) => ({
      ...spot,
      available: spot.isActive && !reservedIds.has(spot.id),
    }));
  }

  async createReservation(
    userId: string,
    data: { spotId: string; startDate: string; endDate: string },
  ) {
    const spot = await this.ensureSpot(data.spotId);

    if (!spot.isActive) {
      throw new BadRequestException("Parking spot is not active");
    }

    ensureDateRange(data.startDate, data.endDate);

    const [conflict] = await this.db
      .select({ id: parkingReservation.id })
      .from(parkingReservation)
      .where(
        and(
          eq(parkingReservation.spotId, data.spotId),
          eq(parkingReservation.status, "active"),
          lte(parkingReservation.startDate, data.endDate),
          gte(parkingReservation.endDate, data.startDate),
        ),
      );

    if (conflict) {
      throw new BadRequestException("Spot is already reserved for these dates");
    }

    const [created] = await this.db
      .insert(parkingReservation)
      .values({
        spotId: data.spotId,
        userId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "active",
      })
      .returning();

    return created;
  }

  async listReservations(options: {
    userId: string;
    role?: string | null;
    from?: string;
    to?: string;
    placeId?: string;
  }) {
    const conditions = [];

    if (options.role !== "admin") {
      conditions.push(eq(parkingReservation.userId, options.userId));
    }

    if (options.from && options.to) {
      parseDate(options.from);
      parseDate(options.to);
      if (options.from > options.to) {
        throw new BadRequestException("Invalid date range");
      }
      conditions.push(lte(parkingReservation.startDate, options.to));
      conditions.push(gte(parkingReservation.endDate, options.from));
    }

    if (options.placeId) {
      conditions.push(eq(parkingSpot.placeId, options.placeId));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const reservations = await this.db
      .select({
        id: parkingReservation.id,
        spotId: parkingReservation.spotId,
        userId: parkingReservation.userId,
        startDate: parkingReservation.startDate,
        endDate: parkingReservation.endDate,
        status: parkingReservation.status,
        createdAt: parkingReservation.createdAt,
        updatedAt: parkingReservation.updatedAt,
        spotLabel: parkingSpot.label,
        placeId: parkingPlace.id,
        placeName: parkingPlace.name,
      })
      .from(parkingReservation)
      .innerJoin(parkingSpot, eq(parkingReservation.spotId, parkingSpot.id))
      .innerJoin(parkingPlace, eq(parkingSpot.placeId, parkingPlace.id))
      .where(whereClause);

    return reservations;
  }

  async cancelReservation(options: {
    userId: string;
    role?: string | null;
    reservationId: string;
  }) {
    const conditions = [eq(parkingReservation.id, options.reservationId)];

    if (options.role !== "admin") {
      conditions.push(eq(parkingReservation.userId, options.userId));
    }

    const [reservation] = await this.db
      .select({ id: parkingReservation.id })
      .from(parkingReservation)
      .where(and(...conditions));

    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }

    const [updated] = await this.db
      .update(parkingReservation)
      .set({ status: "cancelled" })
      .where(eq(parkingReservation.id, options.reservationId))
      .returning();

    return updated;
  }
}
