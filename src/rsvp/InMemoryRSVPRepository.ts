import { Ok, Err, type Result } from "../lib/result";
import type { IRSVP } from "./RSVP";
import type { IRSVPRepository, RSVPRepositoryError } from "./RSVPRepository";

const UnexpectedError = (message: string): RSVPRepositoryError => ({
  name: "UnexpectedError",
  message,
});

class InMemoryRSVPRepository implements IRSVPRepository {
  private readonly rsvps: Map<string, IRSVP> = new Map();

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<Result<IRSVP | null, RSVPRepositoryError>> {
    try {
      const match = [...this.rsvps.values()].find(
        (r) => r.eventId === eventId && r.userId === userId,
      );
      return Ok(match ?? null);
    } catch {
      return Err(UnexpectedError("Unable to find RSVP."));
    }
  }

  async findByEvent(eventId: string): Promise<Result<IRSVP[], RSVPRepositoryError>> {
    try {
      const matches = [...this.rsvps.values()].filter((r) => r.eventId === eventId);
      return Ok(matches);
    } catch {
      return Err(UnexpectedError("Unable to find RSVPs for event."));
    }
  }

  async findByUser(userId: string): Promise<Result<IRSVP[], RSVPRepositoryError>> {
    try {
      const matches = [...this.rsvps.values()].filter((r) => r.userId === userId);
      return Ok(matches);
    } catch {
      return Err(UnexpectedError("Unable to find RSVPs for user."));
    }
  }

  async create(rsvp: IRSVP): Promise<Result<IRSVP, RSVPRepositoryError>> {
    try {
      this.rsvps.set(rsvp.id, { ...rsvp });
      return Ok({ ...rsvp });
    } catch {
      return Err(UnexpectedError("Unable to create RSVP."));
    }
  }

  async updateStatus(
    id: string,
    status: IRSVP["status"],
  ): Promise<Result<IRSVP | null, RSVPRepositoryError>> {
    try {
      const rsvp = this.rsvps.get(id);
      if (!rsvp) return Ok(null);
      const updated: IRSVP = { ...rsvp, status };
      this.rsvps.set(id, updated);
      return Ok({ ...updated });
    } catch {
      return Err(UnexpectedError("Unable to update RSVP status."));
    }
  }

  async countByEventAndStatus(
    eventId: string,
    status: IRSVP["status"],
  ): Promise<Result<number, RSVPRepositoryError>> {
    try {
      const count = [...this.rsvps.values()].filter(
        (r) => r.eventId === eventId && r.status === status,
      ).length;
      return Ok(count);
    } catch {
      return Err(UnexpectedError("Unable to count RSVPs."));
    }
  }
}

export function CreateInMemoryRSVPRepository(): IRSVPRepository {
  return new InMemoryRSVPRepository();
}
