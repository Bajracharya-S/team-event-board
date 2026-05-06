import { Ok, Err, type Result } from "../lib/result";
import type { IEventRepository } from "./EventRepository";
import type { IEvent } from "./Event";
import type { EventError } from "./errors";
import { EventNotFoundError, ForbiddenError, InvalidTransitionError, UnexpectedEventError } from "./errors";
import type { UserRole } from "../auth/User";
import type { ISaveService } from "../saveForLater/SaveService";

export interface ActingUser {
  userId: string;
  role: UserRole;
}

export interface IEventService {
  getEventById(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  publishEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  cancelEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  deleteEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
  toggleDraftPublishedVisibility(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>>;
}

class EventService implements IEventService {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly saveService?: ISaveService,
  ) {}

  async getEventById(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError("An unexpected error occurred."));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (event.status === "draft") {
      const canSeeDraft =
        actor.role === "admin" ||
        actor.role === "staff" ||
        event.organizerId === actor.userId;
      if (!canSeeDraft) {
        return Err(EventNotFoundError());
      }
    }

    return Ok(event);
  }

  async publishEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError("An unexpected error occurred."));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (actor.role !== "admin" && event.organizerId !== actor.userId) {
      return Err(ForbiddenError());
    }

    if (event.status !== "draft") {
      return Err(InvalidTransitionError("Only draft events can be published."));
    }

    const updated = await this.eventRepository.updateStatus(eventId, "published");
    if (!updated.ok) return Err(UnexpectedEventError("An unexpected error occurred."));
    if (!updated.value) return Err(UnexpectedEventError("Event not found during update."));
    return Ok(updated.value);
}

  async cancelEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok)  return Err(UnexpectedEventError("An unexpected error occurred."));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (actor.role !== "admin" && event.organizerId !== actor.userId) {
      return Err(ForbiddenError());
    }

    if (event.status !== "published") {
      return Err(InvalidTransitionError("Only published events can be cancelled."));
    }

    const updated = await this.eventRepository.updateStatus(eventId, "cancelled");
    if (!updated.ok) return Err(UnexpectedEventError("An unexpected error occurred."));
    if (!updated.value) return Err(UnexpectedEventError("Event not found during update."));
    
    // Remove from saved events when cancelled
    if (this.saveService) {
      await this.saveService.removeEventFromSavedEvents(eventId);
    }
    
    return Ok(updated.value);
}

  async toggleDraftPublishedVisibility(
    eventId: string,
    actor: ActingUser,
  ): Promise<Result<IEvent, EventError>> {
    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError("An unexpected error occurred."));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    if (actor.role !== "admin" && event.organizerId !== actor.userId) {
      return Err(ForbiddenError());
    }

    if (event.status !== "draft" && event.status !== "published") {
      return Err(InvalidTransitionError("Only draft or published events can be switched."));
    }

    const nextStatus = event.status === "draft" ? "published" : "draft";
    const updated = await this.eventRepository.updateStatus(eventId, nextStatus);
    if (!updated.ok) return Err(UnexpectedEventError("An unexpected error occurred."));
    if (!updated.value) return Err(UnexpectedEventError("Event not found during update."));
    
    // Remove from saved events when unpublished (changing from published to draft)
    if (nextStatus === "draft" && this.saveService) {
      await this.saveService.removeEventFromSavedEvents(eventId);
    }
    
    return Ok(updated.value);
  }

  async deleteEvent(eventId: string, actor: ActingUser): Promise<Result<IEvent, EventError>> {
    if (actor.role !== "admin") {
      return Err(ForbiddenError());
    }

    const result = await this.eventRepository.findById(eventId);
    if (!result.ok) return Err(UnexpectedEventError("An unexpected error occurred."));

    const event = result.value;
    if (!event) return Err(EventNotFoundError());

    const deleted = await this.eventRepository.delete(eventId);
    if (!deleted.ok) return Err(UnexpectedEventError("An unexpected error occurred."));
    if (!deleted.value) return Err(EventNotFoundError());

    return Ok(event);
  }
}

export function CreateEventService(
  eventRepository: IEventRepository,
  saveService?: ISaveService,
): IEventService {
  return new EventService(eventRepository, saveService);
}