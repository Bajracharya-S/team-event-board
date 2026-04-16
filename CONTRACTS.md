Siddh Bhagat- Features 1 and 4

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


Nithi Vankineni - Feature 2 and 5

Feature 2 — Event Detail Page

Method signature: getEvent(eventId: string, requesterId: string): Promise<Result<Event, EventError>>
Parameters: eventId: string requesterId: string

Success:
type Event = {
  title: string;
  description: string;
  location: string;
  category: string;
  dateTime: Date;
  organizerName: string;
  attendeeCount: number;
  capacity: number;
  status: "draft" | "published" | "cancelled";
};
{ ok: true, value: Event }
Rendered controls vary by role: organizers and admins see edit and cancel buttons; members see the RSVP button.

Errors:
type EventError = | EventNotFoundError;
EventNotFoundError
Returned when: Event does not exist — or when the requester is not permitted to see it. Draft events are only visible to the organizer who created them and to admins; all other users receive a not-found response.

Feature 5 — Event Publishing and Cancellation

Method signature: publishEvent(eventId: string, requesterId: string): Promise<Result<Event, TransitionError>>
Method signature: cancelEvent(eventId: string, requesterId: string): Promise<Result<Event, TransitionError>>

Parameters: eventId: string requesterId: string

Success:
type Event = {
  id: string;
  status: "published" | "cancelled";
};
{ ok: true, value: Event }
The status badge and action controls update inline via HTMX without a full page reload.

Errors:
type TransitionError = | InvalidStateTransitionError | UnauthorizedError;
InvalidStateTransitionError
Returned when: The requested transition is not valid — publishing an already-published event, or attempting to restore a cancelled event.
UnauthorizedError
Returned when: The requester does not have permission. Organizers may only publish or cancel their own events. Admins may cancel any event. Members cannot perform either action

# Mai Long Vuong - features 11 and 13

# Feature 11 — Past Event Archiving

Method signature:
archiveExpiredEvents(now: Date): Promise<Result<ArchiveResult>>

Parameters:
now: Date

Success:
type ArchiveResult = {
  archivedCount: number;
  archivedEventIds: string[];
};

- All events where:
  - status === "published"
  - endTime < now
- are updated to:
  - status = "past"

Errors:

InvalidNowError

Returned when:
- now is missing or not a valid Date

---

Method signature:
getArchivedEvents(userId: string, category?: string): Promise<Result<Event[]>>

Parameters:
userId: string
category?: string

Success:
Event[] // only events with status = "past", sorted by endTime DESC
- Only authenticated users can access
- If category provided → filter by category

Errors:

UnauthorizedError

Returned when:
- User is not authenticated

InvalidCategoryError

Returned when:
- Category value is invalid

---

# Feature 13 — Event Comments

Method signature:
createComment(eventId: string, userId: string, content: string): Promise<Result<Comment>>

Parameters:
eventId: string
userId: string
content: string

Success:
type Comment = {
  id: string;
  eventId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

- Comment is created and returned

Errors:

EventNotFoundError

Returned when:
- Event does not exist

EventNotPublishedError

Returned when:
- Event is not in "published" status

UnauthorizedError

Returned when:
- User is not authenticated

InvalidContentError

Returned when:
- Content is empty or only whitespace
- Content exceeds max length

---

Method signature:
getComments(eventId: string): Promise<Result<Comment[]>>

Parameters:
eventId: string

Success:
Comment[] // sorted by createdAt ASC

Errors:

EventNotFoundError

Returned when:
- Event does not exist

EventNotPublishedError

Returned when:
- Event is not published

---

Method signature:
deleteComment(commentId: string, userId: string): Promise<Result<string>>

Parameters:
commentId: string
userId: string

Success:
string // deleted commentId

Errors:
CommentNotFoundError

Returned when:
- Comment does not exist

UnauthorizedError

Returned when:
- User is not:
  - comment author
  - OR event organizer
  - OR admin