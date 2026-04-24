import { Ok, Err, type Result } from "../lib/result";
import type { IEvent } from "../event/Event";
import type { IEventRepository } from "../event/EventRepository";
import { EVENT_CATEGORIES } from "../event/categories";
import {
  InvalidNowError,
  UnauthorizedError,
  InvalidCategoryError,
  UnexpectedError,
  type ArchiveError,
} from "./errors";

export const VALID_CATEGORIES = EVENT_CATEGORIES;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export interface ArchiveResult {
  archivedCount: number;
  archivedEventIds: string[];
}

export interface IArchiveService {
  archiveExpiredEvents(now: Date): Promise<Result<ArchiveResult, ArchiveError>>;
  getArchivedEvents(userId: string, category?: string): Promise<Result<IEvent[], ArchiveError>>;
}

class ArchiveService implements IArchiveService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async archiveExpiredEvents(now: Date): Promise<Result<ArchiveResult, ArchiveError>> {
    if (!now || isNaN(now.getTime())) {
      return Err(InvalidNowError("A valid current date is required to archive events."));
    }

    const publishedResult = await this.eventRepo.findByStatus("published");
    if (publishedResult.ok === false) {
      return Err(UnexpectedError(publishedResult.value.message));
    }

    const expired = publishedResult.value.filter((e) => e.endDatetime < now);
    const archivedEventIds: string[] = [];

    for (const event of expired) {
      const updateResult = await this.eventRepo.updateStatus(event.id, "past");
      if (updateResult.ok === false) {
        return Err(UnexpectedError(updateResult.value.message));
      }
      archivedEventIds.push(event.id);
    }

    return Ok({ archivedCount: archivedEventIds.length, archivedEventIds });
  }

  async getArchivedEvents(
    userId: string,
    category?: string,
  ): Promise<Result<IEvent[], ArchiveError>> {
    if (!userId || !userId.trim()) {
      return Err(UnauthorizedError("You must be logged in to view the archive."));
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category as ValidCategory)) {
      return Err(InvalidCategoryError(`"${category}" is not a valid category.`));
    }

    const pastResult = await this.eventRepo.findByStatus("past");
    if (pastResult.ok === false) {
      return Err(UnexpectedError(pastResult.value.message));
    }

    let events = pastResult.value;

    if (category) {
      events = events.filter((e) => e.category === category);
    }

    events.sort((a, b) => b.endDatetime.getTime() - a.endDatetime.getTime());

    return Ok(events);
  }
}

export function CreateArchiveService(eventRepo: IEventRepository): IArchiveService {
  return new ArchiveService(eventRepo);
}
