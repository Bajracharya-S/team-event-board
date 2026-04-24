import request from "supertest";
import { createComposedApp } from "../src/composition";

async function login(
  agent: request.Agent,
  email: string,
  password = "password123",
): Promise<void> {
  await agent
    .post("/login")
    .type("form")
    .send({
      email,
      password,
    });
}

describe("Comment HTTP contracts", () => {
  it("posts a comment inline for a published event", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await login(agent, "user@app.test");

    const response = await agent
      .post("/events/event-4/comments")
      .set("HX-Request", "true")
      .type("form")
      .send({ content: "Looking forward to this event." });

    expect(response.status).toBe(201);
    expect(response.text).toContain('id="comment-list"');
    expect(response.text).toContain("Looking forward to this event.");
    expect(response.text).toContain("Una User");
  });

  it("rejects empty comments with a 400 response", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await login(agent, "user@app.test");

    const response = await agent
      .post("/events/event-4/comments")
      .set("HX-Request", "true")
      .type("form")
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Comment cannot be empty.");
  });

  it("allows the comment author to delete their own comment", async () => {
    const app = createComposedApp().getExpressApp();
    const agent = request.agent(app);

    await login(agent, "user@app.test");

    await agent
      .post("/events/event-4/comments")
      .set("HX-Request", "true")
      .type("form")
      .send({ content: "This is my comment." });

    const eventPage = await agent.get("/events/event-4");
    const match = eventPage.text.match(/\/comments\/([^/]+)\/delete/);

    expect(match).not.toBeNull();

    const response = await agent
      .post(`/comments/${match?.[1]}/delete`)
      .set("HX-Request", "true")
      .type("form")
      .send({ eventId: "event-4" });

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="comment-list"');
    expect(response.text).not.toContain("This is my comment.");
  });

  it("allows the event organizer to delete another user's comment", async () => {
    const app = createComposedApp().getExpressApp();
    const attendee = request.agent(app);
    const organizer = request.agent(app);

    await login(attendee, "user@app.test");
    await login(organizer, "staff@app.test");

    await attendee
      .post("/events/event-4/comments")
      .set("HX-Request", "true")
      .type("form")
      .send({ content: "Please save me a seat." });

    const organizerEventPage = await organizer.get("/events/event-4");
    const match = organizerEventPage.text.match(/\/comments\/([^/]+)\/delete/);

    expect(match).not.toBeNull();

    const response = await organizer
      .post(`/comments/${match?.[1]}/delete`)
      .set("HX-Request", "true")
      .type("form")
      .send({ eventId: "event-4" });

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="comment-list"');
    expect(response.text).not.toContain("Please save me a seat.");
  });

  it("rejects unauthorized deletion attempts", async () => {
    const app = createComposedApp().getExpressApp();
    const author = request.agent(app);
    const admin = request.agent(app);
    const otherUser = request.agent(app);

    await login(author, "user@app.test");
    await login(admin, "admin@app.test");

    await admin
      .post("/admin/users")
      .type("form")
      .send({
        email: "casey@app.test",
        displayName: "Casey Member",
        password: "password123",
        role: "user",
      });

    await login(otherUser, "casey@app.test");

    await author
      .post("/events/event-4/comments")
      .set("HX-Request", "true")
      .type("form")
      .send({ content: "Only the organizer should be able to moderate this." });

    const authorEventPage = await author.get("/events/event-4");
    const match = authorEventPage.text.match(/\/comments\/([^/]+)\/delete/);

    expect(match).not.toBeNull();

    const response = await otherUser
      .post(`/comments/${match?.[1]}/delete`)
      .set("HX-Request", "true")
      .type("form")
      .send({ eventId: "event-4" });

    expect(response.status).toBe(403);
    expect(response.text).toContain("You do not have permission to delete this comment.");
  });
});
