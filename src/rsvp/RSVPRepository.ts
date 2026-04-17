import type { IRSVP } from "./RSVP";
import type { Result } from "../lib/result";

export type RSVPRepositoryError = { name: "UnexpectedError"; message: string };

export interface IRSVPRepository {
  findByEventAndUser(eventId: string, userId: string): Promise<Result<IRSVP | null, RSVPRepositoryError>>;
  findByEvent(eventId: string): Promise<Result<IRSVP[], RSVPRepositoryError>>;
  findByUser(userId: string): Promise<Result<IRSVP[], RSVPRepositoryError>>;
  create(rsvp: IRSVP): Promise<Result<IRSVP, RSVPRepositoryError>>;
  updateStatus(id: string, status: IRSVP["status"]): Promise<Result<IRSVP | null, RSVPRepositoryError>>;
  countByEventAndStatus(eventId: string, status: IRSVP["status"]): Promise<Result<number, RSVPRepositoryError>>;
}
