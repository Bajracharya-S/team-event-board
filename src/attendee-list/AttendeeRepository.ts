import type { Entry } from './Attendee'

export interface IAttendeeRepository {
  findByEvent(eventId: number): Promise<Entry[]>
}

interface RsvpRecord {
  id: number
  eventId: number
  userId: string
  status: 'going' | 'waitlisted' | 'cancelled'
  createdAt: Date
}


export const rsvpStore = new Map<number, RsvpRecord>()
export const userDisplayNames = new Map<string, string>()

export class InMemoryAttendeeRepository implements IAttendeeRepository {
  async findByEvent(eventId: number): Promise<AttendeeEntry[]> {
    return [...rsvpStore.values()]
      .filter(r => r.eventId === eventId)
      .map(r => ({
        userId: r.userId,
        displayName: userDisplayNames.get(r.userId) ?? r.userId,
        status: r.status,
        rsvpedAt: r.createdAt,
      }))
  }
}