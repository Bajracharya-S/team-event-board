import { Ok, Err, type Result } from "../lib/result";
import type { IEvent } from "../event/Event";
import type { IEventRepository } from "../event/EventRepository";
import {
  ValidationError,
  InvalidTimeRangeError,
  UnauthorizedError,
  type EventCreationError,
} from "./errors";

export type CreateEventInput = {
  title: string;
  description: string;
  location: string;
  category: string;
  startTime: Date;
  endTime: Date;
  capacity: number | null;
};

export const VALID_CATEGORIES = [
  "social",
  "educational",
  "volunteer",
  "sports",
  "arts",
] as const;

export interface IEventCreationService {
  createEvent(
    input: CreateEventInput,
    organizerId: string,
    organizerRole: string,
  ): Promise<Result<IEvent, EventCreationError>>;
}

class EventCreationService implements IEventCreationService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async createEvent(
    input: CreateEventInput,
    organizerId: string,
    organizerRole: string,
  ): Promise<Result<IEvent, EventCreationError>> {
    if (organizerRole === "user") {
      return Err(UnauthorizedError("Only organizers and admins can create events."));
    }

    if (!input.title || !input.title.trim()) {
      return Err(ValidationError("Title is required."));
    }

    if (!input.description || !input.description.trim()) {
      return Err(ValidationError("Description is required."));
    }

    if (!input.location || !input.location.trim()) {
      return Err(ValidationError("Location is required."));
    }

    if (!input.category || !input.category.trim()) {
      return Err(ValidationError("Category is required."));
    }

    if (!VALID_CATEGORIES.includes(input.category as (typeof VALID_CATEGORIES)[number])) {
      return Err(ValidationError(`Invalid category: ${input.category}`));
    }

    if (!input.startTime || isNaN(input.startTime.getTime())) {
      return Err(ValidationError("A valid start time is required."));
    }

    if (!input.endTime || isNaN(input.endTime.getTime())) {
      return Err(ValidationError("A valid end time is required."));
    }

    if (input.capacity !== null && input.capacity <= 0) {
      return Err(ValidationError("Capacity must be greater than zero."));
    }

    if (input.endTime.getTime() <= input.startTime.getTime()) {
      return Err(InvalidTimeRangeError("End time must be after start time."));
    }

    const now = new Date();
    const event: IEvent = {
      id: this.eventRepo.generateEventId(),
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      category: input.category.trim(),
      status: "draft",
      capacity: input.capacity,
      startDatetime: input.startTime,
      endDatetime: input.endTime,
      organizerId,
      createdAt: now,
      updatedAt: now,
    };

    const repoResult = await this.eventRepo.create(event);
    if (repoResult.ok === false) {
      return Err(ValidationError("Failed to create event."));
    }

    return Ok(repoResult.value);
  }
}

export function CreateEventCreationService(
  eventRepo: IEventRepository,
): IEventCreationService {
  return new EventCreationService(eventRepo);
}
