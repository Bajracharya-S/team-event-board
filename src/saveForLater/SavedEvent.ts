export interface SavedEvent {
  id: number
  userId: string
  eventId: number
  savedAt: Date
}

let nextId = 1

export function createSavedEvent(userId: string, eventId: number): SavedEvent {
  return {
    id: nextId++,
    userId,
    eventId,
    savedAt: new Date(),
  }
}