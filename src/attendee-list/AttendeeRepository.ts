import type { IRSVP } from '../rsvp/RSVP'
import type { IRSVPRepository } from '../rsvp/RSVPRepository'
import type { AttendeeEntry } from './Attendee'

export interface IAttendeeRepository {
  findByEvent(eventId: string): Promise<AttendeeEntry[]>
}

// User display name lookup — keyed by userId, populated from session data
export const userDisplayNames = new Map<string, string>()

export class InMemoryAttendeeRepository implements IAttendeeRepository {
  constructor(private readonly rsvpRepo: IRSVPRepository) {}

  async findByEvent(eventId: string): Promise<AttendeeEntry[]> {
    const result = await this.rsvpRepo.findByEvent(eventId)
    if (!result.ok) return []

    return result.value.map((r: IRSVP) => ({
      userId: r.userId,
      displayName: userDisplayNames.get(r.userId) ?? r.userId,
      status: r.status,
      rsvpedAt: r.createdAt,
    }))
  }
}