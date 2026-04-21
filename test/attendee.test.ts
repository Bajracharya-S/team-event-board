import { InMemoryAttendeeRepository } from "../src/attendee-list/AttendeeRepository";
import { CreateAttendeeService } from "../src/attendee-list/AttendeeService";
import { CreateInMemoryRSVPRepository } from "../src/rsvp/InMemoryRSVPRepository";
import { CreateInMemoryEventRepository } from "../src/event/InMemoryEventRepository";

describe("AttendeeService", () => {
  it("returns EventNotFound for a non-existent event", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    const result = await service.getGroupedAttendees("non-existent", "user-staff", "staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("EventNotFound");
    }
  });

  it("blocks a member from viewing attendees", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    // event-1 is seeded with organizerId "user-staff"
    const result = await service.getGroupedAttendees("event-1", "user-1", "user");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("Unauthorized");
    }
  });

  it("allows an admin to view any event's attendees", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    const result = await service.getGroupedAttendees("event-1", "user-admin", "admin");

    expect(result.ok).toBe(true);
  });

  it("allows the organizer to view their own event's attendees", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    // event-1 organizerId is "user-staff"
    const result = await service.getGroupedAttendees("event-1", "user-staff", "staff");

    expect(result.ok).toBe(true);
  });

  it("groups attendees by status", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    // seed some RSVPs
    await rsvpRepo.create({ id: "rsvp-1", eventId: "event-1", userId: "user-1", status: "going", createdAt: new Date() });
    await rsvpRepo.create({ id: "rsvp-2", eventId: "event-1", userId: "user-2", status: "waitlisted", createdAt: new Date() });
    await rsvpRepo.create({ id: "rsvp-3", eventId: "event-1", userId: "user-3", status: "cancelled", createdAt: new Date() });

    const result = await service.getGroupedAttendees("event-1", "user-staff", "staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.going).toHaveLength(1);
      expect(result.value.waitlisted).toHaveLength(1);
      expect(result.value.cancelled).toHaveLength(1);
    }
  });

  it("sorts attendees by rsvpedAt ascending within each group", async () => {
    const rsvpRepo = CreateInMemoryRSVPRepository();
    const eventRepo = CreateInMemoryEventRepository();
    const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
    const service = CreateAttendeeService(attendeeRepo, eventRepo);

    const first = new Date("2024-01-01T10:00:00Z");
    const second = new Date("2024-01-01T11:00:00Z");

    await rsvpRepo.create({ id: "rsvp-1", eventId: "event-1", userId: "user-2", status: "going", createdAt: second });
    await rsvpRepo.create({ id: "rsvp-2", eventId: "event-1", userId: "user-1", status: "going", createdAt: first });

    const result = await service.getGroupedAttendees("event-1", "user-staff", "staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.going[0].rsvpedAt).toEqual(first);
      expect(result.value.going[1].rsvpedAt).toEqual(second);
    }
  });
});