export interface SavedEvent {
  id: number
  userId: string
  eventId: string
  savedAt: Date
}

let nextId = 1

export function createSavedEvent(userId: string, eventId: string): SavedEvent {
  return {
    id: nextId++,
    userId,
    eventId,
    savedAt: new Date(),
  }
}