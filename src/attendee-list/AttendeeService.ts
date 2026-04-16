import { Ok, Err, type Result } from '../lib/result'
import type { AttendeeEntry, GroupedAttendees } from './Attendee' 
import type { IAttendeeRepository } from './AttendeeRepository'

export type AttendeeError =
  | { name: 'EventNotFound'; message: string }
  | { name: 'Unauthorized'; message: string }

export interface IAttendeeService {
  getGroupedAttendees(
    eventId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Result<GroupedAttendees, AttendeeError>>
}

// In-memory event store — matches the shape from the spec
interface EventRecord {
  id: string
  organizerId: string
  status: 'draft' | 'published' | 'cancelled' | 'past'
}

// Shared in-memory store — your teammate's Event feature will populate this
export const eventStore = new Map<string, EventRecord>()

export class AttendeeService implements IAttendeeService {
  constructor(private readonly repo: IAttendeeRepository) {}

  async getGroupedAttendees(
    eventId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Result<GroupedAttendees, AttendeeError>> {
    const event = eventStore.get(eventId)

    if (!event) {
      return Err({ name: 'EventNotFound', message: 'Event not found.' } as const)
    }

    const isAdmin = requesterRole === 'admin'
    const isOrganizer = event.organizerId === requesterId

    if (!isAdmin && !isOrganizer) {
      return Err({ name: 'Unauthorized', message: 'Only the organizer or an admin can view attendees.' } as const)
    }

    const attendees: AttendeeEntry[] = await this.repo.findByEvent(eventId)
    const sorted = attendees.sort((a: AttendeeEntry, b: AttendeeEntry) => 
    a.rsvpedAt.getTime() - b.rsvpedAt.getTime()
    )

    const grouped: GroupedAttendees = {
      going: sorted.filter((a : AttendeeEntry) => a.status === 'going'),
      waitlisted: sorted.filter((a : AttendeeEntry) => a.status === 'waitlisted'),
      cancelled: sorted.filter((a : AttendeeEntry) => a.status === 'cancelled'),
    }

    return Ok(grouped)
  }
}

export function CreateAttendeeService(repo: IAttendeeRepository): IAttendeeService {
  return new AttendeeService(repo)
}