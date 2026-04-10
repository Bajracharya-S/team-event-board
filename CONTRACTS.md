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

Shrabin Bajracharya - Features 12 and 14


Feature 14 — Save for Later

Method signature:
toggleSaveEvent(userId: string, eventId: string): Promise<Result<ToggleSaveResult, SaveEventError>>

Parameters:
userId: string
eventId: string

Success:
type ToggleSaveResult = {
status: "saved" | "unsaved";
eventId: string;
};

{
ok: true,
value: ToggleSaveResult
}

Errors:

type SaveEventError =
| EventNotFoundError
| UserNotFoundError
| UnauthorizedError
| EventCancelledError;


getSavedEvents(userId: string): Promise<Result<SavedEvent[], SaveEventError>>

Parameters:
userId: string

Success:
type SavedEvent = {
eventId: string;
title: string;
date: string;
location: string;
};

{
ok: true,
value: SavedEvent[]
}

Errors:

UserNotFoundError — User does not exist
UnauthorizedError — Only members have saved events

Method signature:
isEventSaved(userId: string, eventId: string): Promise<Result<boolean, SaveEventError>>

Parameters:
userId: string
eventId: string

Success:
{
ok: true,
value: boolean
}

true → event is saved
false → event is not saved

Errors:

UserNotFoundError — User does not exist
EventNotFoundError — Event does not exist



Feature 12 — Attendee List (Organizer)

Method signature:
getAttendeeList(eventId: string, requesterId: string): Promise<Result<AttendeeList, AttendeeListError>>

Parameters:
eventId: string
requesterId: string

Success:
type Attendee = {
userId: string;
displayName: string;
rsvpTime: Date;
};

type AttendeeList = {
attending: Attendee[];
waitlisted: Attendee[];
cancelled: Attendee[];
};

{
ok: true,
value: AttendeeList
}

Errors:

type AttendeeListError =
| EventNotFoundError
| UserNotFoundError
| UnauthorizedError;


canViewAttendeeList(eventId: string, requesterId: string): Promise<Result<boolean, AccessError>>

Parameters:
eventId: string
requesterId: string

Success:
{
ok: true,
value: boolean
}

true → requester is organizer or admin
false → requester is not allowed

Errors:

type AccessError =
| EventNotFoundError
| UserNotFoundError;

EventNotFoundError

Returned when:
Event does not exist

UserNotFoundError

Returned when:
Requester does not exist
