import { Ok, Err, type Result } from "../lib/result";
import type { IEvent } from "../event/Event";
import type { IEventRepository } from "../event/EventRepository";

export type EventListError =
  | { name: "InvalidFilterError"; message: string }
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

const UnexpectedError = (message: string): EventListError => ({
  name: "UnexpectedError",
  message,
});

class EventListService implements IEventListService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async listEvents(filters: EventFilters): Promise<Result<IEvent[], EventListError>> {
    const allEventsResult = await this.eventRepo.findAll();

    if (allEventsResult.ok === false) {
      return Err(UnexpectedError(allEventsResult.value.message ?? "Unable to retrieve events."));
    }

    const now = new Date();

    let events = allEventsResult.value.filter((event) => {
      return event.status === "published" && event.startDatetime >= now;
    });

    if (filters.category && filters.category.trim() !== "") {
      const category = filters.category.trim().toLowerCase();
      const validCategories = ["meeting", "hackathon", "workshop", "social"];

      if (!validCategories.includes(category)) {
        return Err(InvalidFilterError(`"${filters.category}" is not a valid category.`));
      }

      events = events.filter((event) => event.category.toLowerCase() === category);
    }

    if (filters.timeframe && filters.timeframe.trim() !== "") {
      const timeframe = filters.timeframe.trim().toLowerCase();

      if (!["all", "week", "weekend"].includes(timeframe)) {
        return Err(InvalidFilterError(`"${filters.timeframe}" is not a valid timeframe.`));
      }

      if (timeframe === "week") {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);

        events = events.filter((event) => {
          return event.startDatetime >= now && event.startDatetime <= endOfWeek;
        });
      }

      if (timeframe === "weekend") {
        events = events.filter((event) => {
          const day = event.startDatetime.getDay();
          return day === 0 || day === 6;
        });
      }
    }

    if (filters.query && filters.query.trim() !== "") {
      const query = filters.query.trim().toLowerCase();

      events = events.filter((event) => {
        return (
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
        );
      });
    }

    return Ok(events);
  }
}

export function CreateEventListService(eventRepo: IEventRepository): IEventListService {
    return new EventListService(eventRepo);
  }