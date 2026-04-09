Siddh Bhagat - Features 1 and 4

Feature 1 — Event Creation

Method signature:
createEvent(input: CreateEventInput, organizerId: string): Promise<Result<Event>>

Parameters:
type CreateEventInput = {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
};

Sucess:
{
  ok: true,
  value: Event // newly created event in "draft" status
}

ValidationError

Returned when input is invalid:

Missing required fields
Empty title/description
Invalid date format
Capacity ≤ 0
InvalidTimeRangeError

Returned when:

endTime <= startTime
UnauthorizedError

Returned when:

User is not an organizer


Feature 4 - RSVP Toggle

Method signature:
toggleRSVP(eventId: string, userId: string): Promise<Result<RSVPResult>>

Sucess:
type RSVPResult = {
  status: "going" | "waitlisted" | "cancelled";
  attendeeCount: number;
};

Errors:
EventNotFoundError

Returned when:

Event does not exist
UnauthorizedError

Returned when:

User is organizer/admin
OR user not allowed to RSVP
EventClosedError

Returned when:

Event is cancelled
OR event is in the past
CapacityCalculationError

Returned when:

Capacity check fails due to inconsistent data (mainly Prisma stage)

