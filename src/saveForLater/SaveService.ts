import { Ok, Err, type Result } from '../lib/result'
import type { SavedEvent } from './SavedEvent'
import type { ISavedEventRepository } from './SaveRepo'

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

export interface ISaveService {
  toggleSaveEvent(userId: string, eventId: number): Promise<Result<ToggleOutcome, SavedEventError>>
}

export class SaveService implements ISaveService {
  constructor(private readonly repo: ISavedEventRepository) {}

  async toggleSaveEvent(
    userId: string,
    eventId: number,
  ): Promise<Result<ToggleOutcome, SavedEventError>> {
    const existing = await this.repo.findByUserAndEvent(userId, eventId)

    if (existing) {
      await this.repo.delete(userId, eventId)
      return Ok('unsaved')
    }

    await this.repo.save(userId, eventId)
    return Ok('saved')
  }

}

export function CreateSaveService(repo: ISavedEventRepository): ISaveService {
  return new SaveService(repo)
}