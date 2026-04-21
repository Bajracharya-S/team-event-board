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
  });