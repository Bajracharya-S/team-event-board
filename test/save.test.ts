import { InMemorySavedEventRepository } from "../src/saveForLater/SaveRepo";
import { CreateSaveService } from "../src/saveForLater/SaveService";

describe("SaveService", () => {
  it("saves an event for a user", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    const result = await service.toggleSaveEvent("user-1", "event-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("saved");
    }
  });

  it("unsaves an event that was already saved", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    await service.toggleSaveEvent("user-1", "event-1");
    const result = await service.toggleSaveEvent("user-1", "event-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("unsaved");
    }
  });

  it("does not create duplicate records when saving the same event twice", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    await service.toggleSaveEvent("user-1", "event-1");
    await service.toggleSaveEvent("user-1", "event-1"); // unsaves
    await service.toggleSaveEvent("user-1", "event-1"); // saves again

    const saved = await service.getSavedEvents("user-1");
    expect(saved).toHaveLength(1);
  });

  it("saved list only contains events for the requesting user", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    await service.toggleSaveEvent("user-1", "event-1");
    await service.toggleSaveEvent("user-1", "event-2");
    await service.toggleSaveEvent("user-2", "event-3");

    const saved = await service.getSavedEvents("user-1");
    expect(saved).toHaveLength(2);
    expect(saved.every(e => e.userId === "user-1")).toBe(true);
  });

  it("saved list is empty after unsaving all events", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    await service.toggleSaveEvent("user-1", "event-1");
    await service.toggleSaveEvent("user-1", "event-1");

    const saved = await service.getSavedEvents("user-1");
    expect(saved).toHaveLength(0);
  });

  it("two different users can save the same event independently", async () => {
    const repo = new InMemorySavedEventRepository();
    const service = CreateSaveService(repo);

    await service.toggleSaveEvent("user-1", "event-1");
    await service.toggleSaveEvent("user-2", "event-1");

    const user1Saved = await service.getSavedEvents("user-1");
    const user2Saved = await service.getSavedEvents("user-2");

    expect(user1Saved).toHaveLength(1);
    expect(user2Saved).toHaveLength(1);
  });
});