import type { PrismaClient, Rsvp} from '@prisma/client'
import type { IUserRepository } from '../auth/UserRepository'
import type { IAttendeeRepository } from './AttendeeRepository'
import type { AttendeeEntry } from './Attendee'
import type { RSVPStatus } from '../rsvp/RSVP'

export class PrismaAttendeeRepository implements IAttendeeRepository {
  constructor(
    private readonly db: PrismaClient,
    private readonly userRepo: IUserRepository,
  ) {}

  async findByEvent(eventId: string): Promise<AttendeeEntry[]> {
    const rsvps = await this.db.rsvp.findMany({ where: { eventId } })

    return Promise.all(
      rsvps.map(async (r) => {
        const userResult = await this.userRepo.findById(r.userId)
        const displayName =
          userResult.ok && userResult.value
            ? userResult.value.displayName
            : r.userId

        return {
          userId: r.userId,
          displayName,
          status: r.status as RSVPStatus,
          rsvpedAt: r.createdAt,
        }
      })
    )
  }
}

export function CreatePrismaAttendeeRepository(
  db: PrismaClient,
  userRepo: IUserRepository,
): IAttendeeRepository {
  return new PrismaAttendeeRepository(db, userRepo)
}