import { Ok, Err, type Result } from "../lib/result";
import type { IEventRepository } from "./EventRepository";
import type { IEvent } from "./Event";
import type { EventError } from "./errors";
import { EventNotFoundError, ForbiddenError, InvalidTransitionError, UnexpectedEventError } from "./errors";
import type { UserRole } from "../auth/User";

export interface ActingUser {
  userId: string;
  role: UserRole;
}

export interface IEventService {
  getEventById(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  publishEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  cancelEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
}

class EventService implements IEventService {
  constructor(private readonly eventRepository: IEventRepository) {}

  async getEventById(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError(result.value.message));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (event.status === "draft") {
      if (actor.role !== "admin" && event.organizerId !== actor.userId) {
        return Err(EventNotFoundError());
      }
    }

    return Ok(event);
  }

  async publishEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError(result.value.message));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (actor.role !== "admin" && event.organizerId !== actor.userId) {
      return Err(ForbiddenError());
    }

    if (event.status !== "draft") {
      return Err(InvalidTransitionError("Only draft events can be published."));
    }

    const updated = await this.eventRepository.updateStatus(eventId, "published");
    if (!updated.ok) return Err(UnexpectedEventError(updated.value.message));
    if (!updated.value) return Err(UnexpectedEventError("Event not found during update."));
    return Ok(updated.value);
}

  async cancelEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok)  return Err(UnexpectedEventError(result.value.message));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (actor.role !== "admin" && event.organizerId !== actor.userId) {
      return Err(ForbiddenError());
    }

    if (event.status !== "published") {
      return Err(InvalidTransitionError("Only published events can be cancelled."));
    }

    const updated = await this.eventRepository.updateStatus(eventId, "cancelled");
    if (!updated.ok) return Err(UnexpectedEventError(updated.value.message));
    if (!updated.value) return Err(UnexpectedEventError("Event not found during update."));
    return Ok(updated.value);
}
}

export function CreateEventService(eventRepository: IEventRepository): IEventService {
  return new EventService(eventRepository);
}