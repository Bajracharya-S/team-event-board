import { Ok, Err, type Result } from '../lib/result'
import type { SavedEvent } from './SavedEvent'
import type { ISavedEventRepository } from './SaveRepo'
import type { IEventRepository } from '../event/EventRepository'
import type { IEvent } from '../event/Event'

export type SavedEventError =
  | { name: 'EventNotFound'; message: string }
  | { name: 'EventCancelled'; message: string }
  | { name: 'Unauthorized'; message: string }

export function isSavedEventError(value: unknown): value is SavedEventError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    ['EventNotFound', 'EventCancelled', 'Unauthorized'].includes(
      (value as { name: string }).name
    )
  )
}

export type ToggleOutcome = 'saved' | 'unsaved'

export interface SavedEventWithDetails {
  savedEvent: SavedEvent
  event: IEvent | null
}

export interface ISaveService {
  toggleSaveEvent(userId: string, eventId: string): Promise<Result<ToggleOutcome, SavedEventError>>
  getSavedEvents(userId: string): Promise<SavedEventWithDetails[]>
}

export class SaveService implements ISaveService {
  constructor(
    private readonly repo: ISavedEventRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async toggleSaveEvent(
    userId: string,
    eventId: string,
  ): Promise<Result<ToggleOutcome, SavedEventError>> {
    const existing = await this.repo.findByUserAndEvent(userId, eventId)
    if (existing) {
      await this.repo.delete(userId, eventId)
      return Ok('unsaved')
    }
    await this.repo.save(userId, eventId)
    return Ok('saved')
  }

  async getSavedEvents(userId: string): Promise<SavedEventWithDetails[]> {
    const saved = await this.repo.findAllByUser(userId)
    return Promise.all(
      saved.map(async (savedEvent) => {
        const result = await this.eventRepo.findById(savedEvent.eventId)
        const event = result.ok && result.value ? result.value : null
        return { savedEvent, event }
      })
    )
  }
}

export function CreateSaveService(
  repo: ISavedEventRepository,
  eventRepo: IEventRepository,
): ISaveService {
  return new SaveService(repo, eventRepo)
}