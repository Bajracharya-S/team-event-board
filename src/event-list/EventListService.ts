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

class EventListService implements IEventListService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async listEvents(filters: EventFilters): Promise<Result<IEvent[], EventListError>> {
    const allEventsResult = await this.eventRepo.findAll();

    if (!allEventsResult.ok) {
      return Err(UnexpectedError("Unable to retrieve events."));
    }

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

    let events = allEventsResult.value.filter(
      (event) => event.status === "published" && event.startDatetime >= now,
    );

    if (category !== "") {
      events = events.filter((event) => event.category.toLowerCase() === category);
    }

    if (timeframe === "week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);

      events = events.filter(
        (event) => event.startDatetime >= now && event.startDatetime <= endOfWeek,
      );
    }

    if (timeframe === "weekend") {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const daysUntilSaturday = (6 - startOfToday.getDay() + 7) % 7;

      const saturday = new Date(startOfToday);
      saturday.setDate(startOfToday.getDate() + daysUntilSaturday);

      const monday = new Date(saturday);
      monday.setDate(saturday.getDate() + 2);

      events = events.filter(
        (event) => event.startDatetime >= saturday && event.startDatetime < monday,
      );
    }

    if (query !== "") {
      const loweredQuery = query.toLowerCase();

      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(loweredQuery) ||
          event.description.toLowerCase().includes(loweredQuery) ||
          event.location.toLowerCase().includes(loweredQuery),
      );
    }

    events.sort((a, b) => a.startDatetime.getTime() - b.startDatetime.getTime());

    return Ok(events);
  }
}

export function CreateEventListService(eventRepo: IEventRepository): IEventListService {
  return new EventListService(eventRepo);
}