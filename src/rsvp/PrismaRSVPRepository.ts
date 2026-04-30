import { Ok, Err, type Result } from "../lib/result";
import type { IRSVP, RSVPStatus } from "./RSVP";
import type { IRSVPRepository, RSVPRepositoryError } from "./RSVPRepository";
import type { PrismaClient } from "@prisma/client";

const UnexpectedError = (msg: string): RSVPRepositoryError => ({ name: "UnexpectedError", message: msg });
const asRSVP = (r: any): IRSVP => ({ ...r, status: r.status as RSVPStatus });

class PrismaRSVPRepository implements IRSVPRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEventAndUser(eventId: string, userId: string): Promise<Result<IRSVP | null, RSVPRepositoryError>> {
    try {
      const row = await this.db.rsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
      return Ok(row ? asRSVP(row) : null);
    } catch { return Err(UnexpectedError("Unable to find RSVP.")); }
  }

  async findByEvent(eventId: string): Promise<Result<IRSVP[], RSVPRepositoryError>> {
    try { return Ok((await this.db.rsvp.findMany({ where: { eventId } })).map(asRSVP)); }
    catch { return Err(UnexpectedError("Unable to find RSVPs for event.")); }
  }

  async findByUser(userId: string): Promise<Result<IRSVP[], RSVPRepositoryError>> {
    try { return Ok((await this.db.rsvp.findMany({ where: { userId } })).map(asRSVP)); }
    catch { return Err(UnexpectedError("Unable to find RSVPs for user.")); }
  }

  async create(rsvp: IRSVP): Promise<Result<IRSVP, RSVPRepositoryError>> {
    try {
      const row = await this.db.rsvp.create({
        data: { id: rsvp.id, eventId: rsvp.eventId, userId: rsvp.userId, status: rsvp.status },
      });
      return Ok(asRSVP(row));
    } catch { return Err(UnexpectedError("Unable to create RSVP.")); }
  }

  async updateStatus(id: string, status: IRSVP["status"]): Promise<Result<IRSVP | null, RSVPRepositoryError>> {
    try {
      const existing = await this.db.rsvp.findUnique({ where: { id } });
      if (!existing) return Ok(null);
      return Ok(asRSVP(await this.db.rsvp.update({ where: { id }, data: { status } })));
    } catch { return Err(UnexpectedError("Unable to update RSVP status.")); }
  }

  async countByEventAndStatus(eventId: string, status: IRSVP["status"]): Promise<Result<number, RSVPRepositoryError>> {
    try { return Ok(await this.db.rsvp.count({ where: { eventId, status } })); }
    catch { return Err(UnexpectedError("Unable to count RSVPs.")); }
  }
}

export function CreatePrismaRSVPRepository(db: PrismaClient): IRSVPRepository {
  return new PrismaRSVPRepository(db);
}
