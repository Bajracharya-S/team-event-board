import { Ok, Err, type Result } from "../lib/result";
import type { IEventRepository } from "../event/EventRepository";
import type { IRSVPRepository } from "./RSVPRepository";
import {
  EventNotFoundError,
  UnauthorizedError,
  EventClosedError,
  CapacityCalculationError,
  type RSVPError,
} from "./errors";
import { randomUUID } from "node:crypto";

export type RSVPResult = {
  status: "going" | "waitlisted" | "cancelled";
  attendeeCount: number;
};

export interface IRSVPService {
  toggleRSVP(eventId: string, userId: string, userRole: string): Promise<Result<RSVPResult, RSVPError>>;
}

class RSVPService implements IRSVPService {
  constructor(
    private readonly rsvpRepo: IRSVPRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async toggleRSVP(
    eventId: string,
    userId: string,
    userRole: string,
  ): Promise<Result<RSVPResult, RSVPError>> {
    if (userRole === "admin" || userRole === "staff") {
      return Err(UnauthorizedError("Organizers and admins cannot RSVP to events."));
    }

    const eventResult = await this.eventRepo.findById(eventId);
    if (eventResult.ok === false) {
      return Err(EventNotFoundError("Event not found."));
    }
    const event = eventResult.value;
    if (!event) {
      return Err(EventNotFoundError("Event not found."));
    }

    if (event.status === "cancelled" || event.status === "past") {
      return Err(EventClosedError("Cannot RSVP to a cancelled or past event."));
    }

    if (event.status === "draft") {
      return Err(EventNotFoundError("Event not found."));
    }

    const existingResult = await this.rsvpRepo.findByEventAndUser(eventId, userId);
    if (existingResult.ok === false) {
      return Err(CapacityCalculationError("Failed to check existing RSVP."));
    }

    const existing = existingResult.value;

    if (existing && existing.status === "going") {
      const updateResult = await this.rsvpRepo.updateStatus(existing.id, "cancelled");
      if (updateResult.ok === false) {
        return Err(CapacityCalculationError("Failed to cancel RSVP."));
      }
      const count = await this.getAttendeeCount(eventId);
      if (count.ok === false) return count;
      return Ok({ status: "cancelled", attendeeCount: count.value });
    }

    if (existing && existing.status === "waitlisted") {
      const updateResult = await this.rsvpRepo.updateStatus(existing.id, "cancelled");
      if (updateResult.ok === false) {
        return Err(CapacityCalculationError("Failed to cancel RSVP."));
      }
      const count = await this.getAttendeeCount(eventId);
      if (count.ok === false) return count;
      return Ok({ status: "cancelled", attendeeCount: count.value });
    }

    const countResult = await this.getAttendeeCount(eventId);
    if (countResult.ok === false) return countResult;

    const isFull = event.capacity !== null && countResult.value >= event.capacity;
    const newStatus = isFull ? "waitlisted" as const : "going" as const;

    if (existing && existing.status === "cancelled") {
      const updateResult = await this.rsvpRepo.updateStatus(existing.id, newStatus);
      if (updateResult.ok === false) {
        return Err(CapacityCalculationError("Failed to reactivate RSVP."));
      }
    } else {
      const rsvp = {
        id: randomUUID(),
        eventId,
        userId,
        status: newStatus,
        createdAt: new Date(),
      };
      const createResult = await this.rsvpRepo.create(rsvp);
      if (createResult.ok === false) {
        return Err(CapacityCalculationError("Failed to create RSVP."));
      }
    }

    const finalCount = await this.getAttendeeCount(eventId);
    if (finalCount.ok === false) return finalCount;
    return Ok({ status: newStatus, attendeeCount: finalCount.value });
  }

  private async getAttendeeCount(eventId: string): Promise<Result<number, RSVPError>> {
    const result = await this.rsvpRepo.countByEventAndStatus(eventId, "going");
    if (result.ok === false) {
      return Err(CapacityCalculationError("Failed to count attendees."));
    }
    return Ok(result.value);
  }
}

export function CreateRSVPService(
  rsvpRepo: IRSVPRepository,
  eventRepo: IEventRepository,
): IRSVPService {
  return new RSVPService(rsvpRepo, eventRepo);
}
