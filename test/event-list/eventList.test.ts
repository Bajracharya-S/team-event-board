import request from "supertest";
import { createComposedApp } from "../../src/composition";
import type { Application } from "express";

async function loginAs(
  app: Application,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app)
    .post("/login")
    .send(`email=${email}&password=${password}`)
    .set("Content-Type", "application/x-www-form-urlencoded");

  const cookie = res.headers["set-cookie"];
  return Array.isArray(cookie) ? cookie[0] : cookie;
}

describe("Feature 6 and Feature 10: event list filters and search", () => {
  let app: Application;
  let userCookie: string;

  beforeEach(async () => {
    app = createComposedApp().getExpressApp();
    userCookie = await loginAs(app, "user@app.test", "password123");
  });

  it("shows published upcoming events by default", async () => {
    const res = await request(app)
      .get("/events")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
    expect(res.text).not.toContain("Sprint Planning");
  });

  it("filters by valid category", async () => {
    const res = await request(app)
      .get("/events?category=social")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
  });

  it("returns 400 for invalid category", async () => {
    const res = await request(app)
      .get("/events?category=bad-category")
      .set("Cookie", userCookie);

    expect(res.status).toBe(400);
    expect(res.text).toContain("not a valid category");
  });

  it("filters by valid timeframe", async () => {
    const res = await request(app)
      .get("/events?timeframe=all")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
  });

  it("returns 400 for invalid timeframe", async () => {
    const res = await request(app)
      .get("/events?timeframe=forever")
      .set("Cookie", userCookie);

    expect(res.status).toBe(400);
    expect(res.text).toContain("not a valid timeframe");
  });

  it("searches by event title", async () => {
    const res = await request(app)
      .get("/events?query=game")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
  });

  it("searches by event description or location", async () => {
    const res = await request(app)
      .get("/events?query=common")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
  });

  it("returns all published upcoming events for empty search", async () => {
    const res = await request(app)
      .get("/events?query=")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
  });

  it("returns 400 for search input longer than 100 characters", async () => {
    const longQuery = "a".repeat(101);

    const res = await request(app)
      .get(`/events?query=${longQuery}`)
      .set("Cookie", userCookie);

    expect(res.status).toBe(400);
    expect(res.text).toContain("100 characters or fewer");
  });

  it("returns only the event list fragment for HTMX requests", async () => {
    const res = await request(app)
      .get("/events?query=game")
      .set("Cookie", userCookie)
      .set("HX-Request", "true");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Game Night");
    expect(res.text).not.toContain("<!doctype html>");
  });

  it("redirects unauthenticated users to login", async () => {
    const res = await request(app).get("/events");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});