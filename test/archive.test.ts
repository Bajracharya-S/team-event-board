import request from "supertest";
import { createComposedApp } from "../src/composition";

async function loginAsUser(agent: request.Agent): Promise<void> {
  await agent
    .post("/login")
    .type("form")
    .send({
      email: "user@app.test",
      password: "password123",
    });
}

describe("Archive HTTP contracts", () => {
  it("archives expired published events and shows them on GET /archive", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await loginAsUser(agent);

    const response = await agent.get("/archive");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Team Kickoff 2024");
    expect(response.text).toContain("Hackathon Spring");
    expect(response.text).toContain("Workshop: Intro to TypeScript");
  });

  it("does not archive non-expired events", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await loginAsUser(agent);

    const response = await agent.get("/archive");

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("Game Night");
    expect(response.text).not.toContain("Sprint Planning");
  });

  it("filters archived events by category", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await loginAsUser(agent);

    const response = await agent.get("/archive?category=educational");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Team Kickoff 2024");
    expect(response.text).toContain("Hackathon Spring");
    expect(response.text).toContain("Workshop: Intro to TypeScript");
  });

  it("returns 400 for an invalid archive category", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await loginAsUser(agent);

    const response = await agent.get("/archive?category=not-a-category");

    expect(response.status).toBe(400);
    expect(response.text).toContain("not-a-category");
    expect(response.text).toContain("is not a valid category.");
  });

  it("returns only the archive results fragment for HTMX requests", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await loginAsUser(agent);

    const response = await agent
      .get("/archive?category=educational")
      .set("HX-Request", "true");

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="archive-results"');
    expect(response.text).toContain("Team Kickoff 2024");
    expect(response.text).not.toContain("<html");
    expect(response.text).not.toContain("Past Events");
  });
});
