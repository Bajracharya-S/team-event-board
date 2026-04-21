import request from "supertest";
import { createComposedApp } from "../../src/composition";

const app = createComposedApp().getExpressApp();

// Helper: log in and return the session cookie
async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post("/login")
    .send(`email=${email}&password=${password}`)
    .set("Content-Type", "application/x-www-form-urlencoded");
  const cookie = res.headers["set-cookie"];
  return Array.isArray(cookie) ? cookie[0] : cookie;
}

//Feature 2 Tests
describe("GET /events/:id", () => {
    it("returns 200 and renders event details for a published even as admin", async () => {
        const cookie = await loginAs("admin@app.test", "password123");
        const res = await request(app)
            .get("/events/event-1")
            .set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Team Kickoff 2024");
    });

    it("returns 200 and renders event details for a published even as staff", async () => {
        const cookie = await loginAs("staff@app.test", "password123");
        const res = await request(app)
          .get("/events/event-2")
          .set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Hackathon Spring");
      });

    it("returns 200 for a published event viewed by a user", async () => {
        const cookie = await loginAs("user@app.test", "password123");
        const res = await request(app)
          .get("/events/event-1")
          .set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.text).toContain("RSVP");
    });

    it("returns 404 for a draft event viewed by a user", async () => {
        const cookie = await loginAs("user@app.test", "password123");
        const res = await request(app)
          .get("/events/event-5")
          .set("Cookie", cookie);
        expect(res.status).toBe(404);
    });

    it("returns 404 for a non-existent event as admin", async () => {
        const cookie = await loginAs("admin@app.test", "password123");
        const res = await request(app)
            .get("/events/event-20")
            .set("Cookie", cookie);
        expect(res.status).toBe(404);
      });
  
    it("returns 404 for a non-existent event as staff", async () => {
        const cookie = await loginAs("staff@app.test", "password123");
        const res = await request(app)
            .get("/events/event-20")
            .set("Cookie", cookie);
        expect(res.status).toBe(404);
    });
  
    it("returns 404 for a non-existent event as user", async () => {
        const cookie = await loginAs("user@app.test", "password123");
        const res = await request(app)
            .get("/events/event-20")
            .set("Cookie", cookie);
        expect(res.status).toBe(404);
    });
  });

//Feature 5 Tests
describe("POST /events/:id/publish", () => {
    it("returns 302 and publishes a draft event as organizer", async () => {
      const cookie = await loginAs("staff@app.test", "password123");
      const res = await request(app)
        .post("/events/event-5/publish")
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
    });
  
    it("returns 400 when trying to publish an already published event", async () => {
      const cookie = await loginAs("staff@app.test", "password123");
      const res = await request(app)
        .post("/events/event-1/publish")
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
    });
  
    it("returns 403 when a user tries to publish", async () => {
      const cookie = await loginAs("user@app.test", "password123");
      const res = await request(app)
        .post("/events/event-5/publish")
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });
  
    it("returns 404 when publishing a non-existent event", async () => {
      const cookie = await loginAs("staff@app.test", "password123");
      const res = await request(app)
        .post("/events/non-existent-id/publish")
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
    });
  });