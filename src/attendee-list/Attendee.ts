import type { RSVPStatus } from '../rsvp/RSVP'

export interface AttendeeEntry {
  userId: string
  displayName: string
  status: RSVPStatus
  rsvpedAt: Date
}

export interface GroupedAttendees {
  going: AttendeeEntry[]
  waitlisted: AttendeeEntry[]
  cancelled: AttendeeEntry[]
}