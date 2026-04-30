import type { PrismaClient } from '@prisma/client'
import type { ISavedEventRepository } from './SaveRepo'
import type { SavedEvent } from './SavedEvent'

export class PrismaSavedEventRepository implements ISavedEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserAndEvent(userId: string, eventId: string): Promise<SavedEvent | null> {
    return this.db.savedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    })
  }

  async findAllByUser(userId: string): Promise<SavedEvent[]> {
    return this.db.savedEvent.findMany({
      where: { userId },
      orderBy: { savedAt: 'asc' },
    })
  }

  async save(userId: string, eventId: string): Promise<SavedEvent> {
    return this.db.savedEvent.create({
      data: { userId, eventId },
    })
  }

  async delete(userId: string, eventId: string): Promise<void> {
    await this.db.savedEvent.delete({
      where: { userId_eventId: { userId, eventId } },
    })
  }
}