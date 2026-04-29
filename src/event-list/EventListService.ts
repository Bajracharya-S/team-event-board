import { Ok, Err, type Result } from "../lib/result";
import type { IEvent } from "../event/Event";
import type { IEventRepository } from "../event/EventRepository";
import { EVENT_CATEGORIES } from "../event/categories";

export type EventListError =
  | { name: "InvalidFilterError"; message: string }
  | { name: "InvalidSearchInputError"; message: string }
  | { name: "UnexpectedError"; message: string };

export interface EventFilters {
  query?: string;
  category?: string;
  timeframe?: string;
}

export interface IEventListService {
  listEvents(filters: EventFilters): Promise<Result<IEvent[], EventListError>>;
}

const InvalidFilterError = (message: string): EventListError => ({
  name: "InvalidFilterError",
  message,
});

const InvalidSearchInputError = (message: string): EventListError => ({
  name: "InvalidSearchInputError",
  message,
});

const UnexpectedError = (message: string): EventListError => ({
  name: "UnexpectedError",
  message,
});

function getWeekendRange(now: Date): { startsAtOrAfter: Date; startsBefore: Date } {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const daysUntilSaturday = (6 - startOfToday.getDay() + 7) % 7;

  const saturday = new Date(startOfToday);
  saturday.setDate(startOfToday.getDate() + daysUntilSaturday);

  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2);

  return {
    startsAtOrAfter: saturday,
    startsBefore: monday,
  };
}

class EventListService implements IEventListService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async listEvents(filters: EventFilters): Promise<Result<IEvent[], EventListError>> {
    const now = new Date();

    const query = filters.query?.trim() ?? "";
    const category = filters.category?.trim().toLowerCase() ?? "";
    const timeframe = filters.timeframe?.trim().toLowerCase() || "all";

    if (query.length > 100) {
      return Err(InvalidSearchInputError("Search query must be 100 characters or fewer."));
    }

    if (category !== "" && !EVENT_CATEGORIES.includes(category as any)) {
      return Err(InvalidFilterError(`"${filters.category}" is not a valid category.`));
    }

    if (!["all", "week", "weekend"].includes(timeframe)) {
      return Err(InvalidFilterError(`"${filters.timeframe}" is not a valid timeframe.`));
    }

    let startsAtOrAfter = now;
    let startsBefore: Date | undefined;

    if (timeframe === "week") {
      startsBefore = new Date(now);
      startsBefore.setDate(now.getDate() + 7);
    }

    if (timeframe === "weekend") {
      const weekendRange = getWeekendRange(now);
      startsAtOrAfter = weekendRange.startsAtOrAfter;
      startsBefore = weekendRange.startsBefore;
    }

    const eventsResult = await this.eventRepo.findPublishedUpcoming({
      query,
      category: category || undefined,
      startsAtOrAfter,
      startsBefore,
    });

    if (!eventsResult.ok) {
      return Err(UnexpectedError("Unable to retrieve events."));
    }

    return Ok(eventsResult.value);
  }
}

export function CreateEventListService(eventRepo: IEventRepository): IEventListService {
  return new EventListService(eventRepo);
}