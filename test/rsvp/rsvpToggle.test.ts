import request from "supertest";
import { createComposedApp } from "../../src/composition";
import type { Application } from "express";

async function loginAs(app: Application, email: string, password: string): Promise<string> {
  const res = await request(app)
    .post("/login")
    .send(`email=${email}&password=${password}`)
    .set("Content-Type", "application/x-www-form-urlencoded");
  const cookie = res.headers["set-cookie"];
  return Array.isArray(cookie) ? cookie[0] : cookie;
}

describe("POST /events/:eventId/rsvp", () => {
  let app: Application;
  let userCookie: string;

  beforeEach(async () => {
    app = createComposedApp().getExpressApp();
    userCookie = await loginAs(app, "user@app.test", "password123");
  });

  it("returns 200 and going status for first RSVP", async () => {
    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Cancel RSVP");
    expect(res.text).toContain("1 attending");
  });

  it("toggles from going to cancelled on second click", async () => {
    await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);

    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("RSVP");
    expect(res.text).toContain("0 attending");
  });

  it("reactivates a cancelled RSVP on third toggle", async () => {
    await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);
    await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);

    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Cancel RSVP");
    expect(res.text).toContain("1 attending");
  });

  it("returns 404 EventNotFoundError for non-existent event", async () => {
    const res = await request(app)
      .post("/events/non-existent/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
    expect(res.text).toContain("Event not found");
  });

  it("returns 404 EventNotFoundError for draft event", async () => {
    const res = await request(app)
      .post("/events/event-5/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
    expect(res.text).toContain("Event not found");
  });

  it("returns 403 UnauthorizedError for staff", async () => {
    const staffCookie = await loginAs(app, "staff@app.test", "password123");
    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(403);
    expect(res.text).toContain("Organizers and admins cannot RSVP");
  });

  it("returns 403 UnauthorizedError for admin", async () => {
    const adminCookie = await loginAs(app, "admin@app.test", "password123");
    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(403);
    expect(res.text).toContain("Organizers and admins cannot RSVP");
  });

  it("returns 400 EventClosedError for cancelled event", async () => {
    const staffCookie = await loginAs(app, "staff@app.test", "password123");
    await request(app)
      .post("/events/event-4/cancel")
      .set("Cookie", staffCookie);

    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Cannot RSVP to a cancelled or past event");
  });

  it("returns 401 for unauthenticated users", async () => {
    const res = await request(app)
      .post("/events/event-4/rsvp");
    expect(res.status).toBe(401);
  });

  it("places user on waitlist when event is at capacity", async () => {
    const staffCookie = await loginAs(app, "staff@app.test", "password123");
    await request(app)
      .post("/events/event-2/rsvp")
      .set("Cookie", userCookie);

    const res = await request(app)
      .post("/events/event-2/rsvp")
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("0 attending");
  });

  it("returns HTMX partial without full page wrapper", async () => {
    const res = await request(app)
      .post("/events/event-4/rsvp")
      .set("Cookie", userCookie)
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("rsvp-section");
    expect(res.text).not.toContain("<!doctype html>");
  });
});
