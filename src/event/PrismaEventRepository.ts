import { Ok, Err, type Result } from "../lib/result";
import type { IEvent, EventStatus } from "./Event";
import type { EventListQuery, IEventRepository, EventRepositoryError } from "./EventRepository";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const UnexpectedError = (message: string): EventRepositoryError => ({
  name: "UnexpectedError",
  message,
});

function toIEvent(row: {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  capacity: number | null;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}): IEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status as EventStatus,
    capacity: row.capacity,
    startDatetime: row.startDatetime,
    endDatetime: row.endDatetime,
    organizerId: row.organizerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class PrismaEventRepository implements IEventRepository {
  constructor(private readonly db: PrismaClient) {}

  generateEventId(): string {
    return randomUUID();
  }

  async findAll(): Promise<Result<IEvent[], EventRepositoryError>> {
    try {
      const rows = await this.db.event.findMany();
      return Ok(rows.map(toIEvent));
    } catch {
      return Err(UnexpectedError("Unable to retrieve events."));
    }
  }

  async findById(id: string): Promise<Result<IEvent | null, EventRepositoryError>> {
    try {
      const row = await this.db.event.findUnique({ where: { id } });
      return Ok(row ? toIEvent(row) : null);
    } catch {
      return Err(UnexpectedError("Unable to retrieve event."));
    }
  }

  async findByStatus(status: EventStatus): Promise<Result<IEvent[], EventRepositoryError>> {
    try {
      const rows = await this.db.event.findMany({ where: { status } });
      return Ok(rows.map(toIEvent));
    } catch {
      return Err(UnexpectedError("Unable to retrieve events by status."));
    }
  }

  async findPublishedUpcoming(
    query: EventListQuery,
  ): Promise<Result<IEvent[], EventRepositoryError>> {
    try {
      const searchTerm = query.query?.trim();

      const rows = await this.db.event.findMany({
        where: {
          status: "published",
          startDatetime: {
            gte: query.startsAtOrAfter,
            ...(query.startsBefore ? { lt: query.startsBefore } : {}),
          },
          ...(query.category ? { category: query.category } : {}),
          ...(searchTerm
            ? {
                OR: [
                  { title: { contains: searchTerm } },
                  { description: { contains: searchTerm } },
                  { location: { contains: searchTerm } },
                ],
              }
            : {}),
        },
        orderBy: {
          startDatetime: "asc",
        },
      });

      return Ok(rows.map(toIEvent));
    } catch {
      return Err(UnexpectedError("Unable to retrieve published upcoming events."));
    }
  }

  async create(event: IEvent): Promise<Result<IEvent, EventRepositoryError>> {
    try {
      const row = await this.db.event.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          status: event.status,
          capacity: event.capacity,
          startDatetime: event.startDatetime,
          endDatetime: event.endDatetime,
          organizerId: event.organizerId,
        },
      });
      return Ok(toIEvent(row));
    } catch {
      return Err(UnexpectedError("Unable to create event."));
    }
  }

  async updateStatus(
    id: string,
    status: EventStatus,
  ): Promise<Result<IEvent | null, EventRepositoryError>> {
    try {
      const existing = await this.db.event.findUnique({ where: { id } });
      if (!existing) return Ok(null);

      const row = await this.db.event.update({
        where: { id },
        data: { status },
      });

      return Ok(toIEvent(row));
    } catch {
      return Err(UnexpectedError("Unable to update event status."));
    }
  }
}

export function CreatePrismaEventRepository(db: PrismaClient): IEventRepository {
  return new PrismaEventRepository(db);
}