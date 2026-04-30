import request from "supertest";
import { createComposedApp } from "../../src/composition";
import type { Application } from "express";
import { prisma } from "../../src/lib/prisma";

const now = new Date();
const past = (days: number) => new Date(now.getTime() - days * 86400000);
const future = (days: number) => new Date(now.getTime() + days * 86400000);

const SEED_EVENTS = [
  { id: "event-1", title: "Team Kickoff 2024", description: "Annual team kickoff meeting.", location: "Main Hall", category: "educational", status: "published", capacity: null, startDatetime: past(10), endDatetime: past(9), organizerId: "user-staff" },
  { id: "event-2", title: "Hackathon Spring", description: "24-hour hackathon open to all members.", location: "Lab Room B", category: "educational", status: "published", capacity: 30, startDatetime: past(5), endDatetime: past(4), organizerId: "user-staff" },
  { id: "event-3", title: "Workshop: Intro to TypeScript", description: "Beginner-friendly TypeScript workshop.", location: "Room 101", category: "educational", status: "published", capacity: 20, startDatetime: past(2), endDatetime: past(1), organizerId: "user-staff" },
  { id: "event-4", title: "Game Night", description: "Board games and fun for the whole team.", location: "Common Room", category: "social", status: "published", capacity: null, startDatetime: future(3), endDatetime: future(3), organizerId: "user-staff" },
  { id: "event-5", title: "Sprint Planning", description: "Sprint 2 planning session.", location: "Online", category: "educational", status: "draft", capacity: null, startDatetime: future(7), endDatetime: future(7), organizerId: "user-staff" },
];

async function seedDatabase() {
  await prisma.comment.deleteMany();
  await prisma.rsvp.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.event.deleteMany();

  for (const event of SEED_EVENTS) {
    await prisma.event.create({ data: event });
  }
}

async function loginAs(app: Application, email: string, password: string): Promise<string> {
  const res = await request(app)
    .post("/login")
    .send(`email=${email}&password=${password}`)
    .set("Content-Type", "application/x-www-form-urlencoded");
  const cookie = res.headers["set-cookie"];
  return Array.isArray(cookie) ? cookie[0] : cookie;
}

describe("GET /events/:id", () => {
  let app: Application;

  beforeEach(async () => {
    await seedDatabase();
    app = createComposedApp().getExpressApp();
  });

  it("returns 200 and renders event details for a published event", async () => {
    const cookie = await loginAs(app, "staff@app.test", "password123");
    const res = await request(app)
      .get("/events/event-1")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Team Kickoff 2024");
  });

  it("returns 404 for a non-existent event", async () => {
    const cookie = await loginAs(app, "staff@app.test", "password123");
    const res = await request(app)
      .get("/events/non-existent-id")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });

  it("returns 200 for a published event viewed by a regular user", async () => {
    const cookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .get("/events/event-1")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("RSVP");
  });

  it("returns 404 for a draft event viewed by a regular user", async () => {
    const cookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .get("/events/event-5")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });

  it("returns 200 for a draft event viewed by the organizer", async () => {
    const cookie = await loginAs(app, "staff@app.test", "password123");
    const res = await request(app)
      .get("/events/event-5")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
  });

  it("returns 200 for a draft event viewed by an admin", async () => {
    const cookie = await loginAs(app, "admin@app.test", "password123");
    const res = await request(app)
      .get("/events/event-5")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
  });

  it("redirects unauthenticated users to login", async () => {
    const res = await request(app).get("/events/event-1");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});

describe("POST /events/:id/publish", () => {
  let app: Application;
  let staffCookie: string;

  beforeEach(async () => {
    await seedDatabase();
    app = createComposedApp().getExpressApp();
    staffCookie = await loginAs(app, "staff@app.test", "password123");
  });

  it("returns 302 and publishes a draft event as organizer", async () => {
    const res = await request(app)
      .post("/events/event-5/publish")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(302);
  });

  it("returns 400 when trying to publish an already published event", async () => {
    const res = await request(app)
      .post("/events/event-1/publish")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
  });

  it("returns 403 when a regular user tries to publish", async () => {
    const userCookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .post("/events/event-5/publish")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
  });

  it("returns 404 when publishing a non-existent event", async () => {
    const res = await request(app)
      .post("/events/non-existent-id/publish")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(404);
  });
});

describe("POST /events/:id/cancel", () => {
  let app: Application;
  let staffCookie: string;

  beforeEach(async () => {
    await seedDatabase();
    app = createComposedApp().getExpressApp();
    staffCookie = await loginAs(app, "staff@app.test", "password123");
  });

  it("returns 302 and cancels a published event as organizer", async () => {
    const res = await request(app)
      .post("/events/event-1/cancel")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(302);
  });

  it("returns 400 when trying to cancel a draft event", async () => {
    const res = await request(app)
      .post("/events/event-5/cancel")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
  });

  it("returns 403 when a regular user tries to cancel", async () => {
    const userCookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .post("/events/event-1/cancel")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
  });

  it("returns 400 when cancelling an already cancelled event", async () => {
    await request(app)
      .post("/events/event-1/cancel")
      .set("Cookie", staffCookie);
    const res = await request(app)
      .post("/events/event-1/cancel")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
  });

  it("returns 404 when cancelling a non-existent event", async () => {
    const res = await request(app)
      .post("/events/non-existent-id/cancel")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(404);
  });
});
