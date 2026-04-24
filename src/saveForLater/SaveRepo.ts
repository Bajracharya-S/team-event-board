import { type SavedEvent, createSavedEvent } from './SavedEvent'

export interface ISavedEventRepository {
  findByUserAndEvent(userId: string, eventId: string): Promise<SavedEvent | null>
  findAllByUser(userId: string): Promise<SavedEvent[]>
  save(userId: string, eventId: string): Promise<SavedEvent>
  delete(userId: string, eventId: string): Promise<void>
}

export class InMemorySavedEventRepository implements ISavedEventRepository {
  private readonly store = new Map<string, SavedEvent>()

  private key(userId: string, eventId: string): string {
    return `${userId}:${eventId}`
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<SavedEvent | null> {
    return this.store.get(this.key(userId, eventId)) ?? null
  }

  async findAllByUser(userId: string): Promise<SavedEvent[]> {
    return [...this.store.values()]
      .filter(e => e.userId === userId)
      .sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime())
  }

  async save(userId: string, eventId: string): Promise<SavedEvent> {
    const record = createSavedEvent(userId, eventId)
    this.store.set(this.key(userId, eventId), record)
    return record
  }

  async delete(userId: string, eventId: string): Promise<void> {
    this.store.delete(this.key(userId, eventId))
  }
}