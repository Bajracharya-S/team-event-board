import { Ok, Err, type Result } from '../lib/result'
import type { AttendeeEntry, GroupedAttendees } from './Attendee'
import type { IAttendeeRepository } from './AttendeeRepository'
import type { IEventRepository } from '../event/EventRepository'

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

export class AttendeeService implements IAttendeeService {
  constructor(
    private readonly repo: IAttendeeRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async getGroupedAttendees(
    eventId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Result<GroupedAttendees, AttendeeError>> {
    const eventResult = await this.eventRepo.findById(eventId)
    if (!eventResult.ok || !eventResult.value) {
      return Err({ name: 'EventNotFound', message: 'Event not found.' } as const)
    }

    const event = eventResult.value
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
      going: sorted.filter((a: AttendeeEntry) => a.status === 'going'),
      waitlisted: sorted.filter((a: AttendeeEntry) => a.status === 'waitlisted'),
      cancelled: sorted.filter((a: AttendeeEntry) => a.status === 'cancelled'),
    }

    return Ok(grouped)
  }
}

export function CreateAttendeeService(
  repo: IAttendeeRepository,
  eventRepo: IEventRepository,
): IAttendeeService {
  return new AttendeeService(repo, eventRepo)
}