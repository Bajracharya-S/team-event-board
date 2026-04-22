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

const validEvent = {
  title: "Test Event",
  description: "A test event description",
  location: "Room 101",
  category: "social",
  startTime: "2026-06-01T10:00",
  endTime: "2026-06-01T12:00",
  capacity: "50",
};

describe("GET /events/new", () => {
  let app: Application;

  beforeEach(() => {
    app = createComposedApp().getExpressApp();
  });

  it("returns 200 and renders form for staff", async () => {
    const cookie = await loginAs(app, "staff@app.test", "password123");
    const res = await request(app)
      .get("/events/new")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Create New Event");
  });

  it("returns 200 and renders form for admin", async () => {
    const cookie = await loginAs(app, "admin@app.test", "password123");
    const res = await request(app)
      .get("/events/new")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Create New Event");
  });

  it("returns 403 for regular user", async () => {
    const cookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .get("/events/new")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("redirects unauthenticated users to login", async () => {
    const res = await request(app).get("/events/new");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});

describe("POST /events", () => {
  let app: Application;
  let staffCookie: string;

  beforeEach(async () => {
    app = createComposedApp().getExpressApp();
    staffCookie = await loginAs(app, "staff@app.test", "password123");
  });

  it("creates event and redirects on valid input", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams(validEvent).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/home");
  });

  it("returns 400 with ValidationError for missing title", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, title: "" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Title is required");
  });

  it("returns 400 with ValidationError for missing description", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, description: "" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Description is required");
  });

  it("returns 400 with ValidationError for missing location", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, location: "" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Location is required");
  });

  it("returns 400 with ValidationError for invalid category", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, category: "invalid" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Invalid category");
  });

  it("returns 400 with ValidationError for capacity <= 0", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, capacity: "0" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("Capacity must be greater than zero");
  });

  it("returns 400 with InvalidTimeRangeError when end before start", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({
        ...validEvent,
        startTime: "2026-06-01T12:00",
        endTime: "2026-06-01T10:00",
      }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("End time must be after start time");
  });

  it("returns 403 for regular user attempting to create", async () => {
    const userCookie = await loginAs(app, "user@app.test", "password123");
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams(validEvent).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
  });

  it("creates event with null capacity when field is empty", async () => {
    const { capacity, ...noCapacity } = validEvent;
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams(noCapacity).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/home");
  });

  it("returns 400 with InvalidTimeRangeError when start equals end", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({
        ...validEvent,
        startTime: "2026-06-01T10:00",
        endTime: "2026-06-01T10:00",
      }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(400);
    expect(res.text).toContain("End time must be after start time");
  });

  it("returns error via HTMX partial without full page reload", async () => {
    const res = await request(app)
      .post("/events")
      .send(new URLSearchParams({ ...validEvent, title: "" }).toString())
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", staffCookie)
      .set("HX-Request", "true");
    expect(res.status).toBe(400);
    expect(res.text).toContain("Title is required");
    expect(res.text).not.toContain("<!doctype html>");
  });
});
