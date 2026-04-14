import type { Event, CreateEventInput } from "./Event";

export interface IEventRepository {

  create(event: Event): Promise<Event>;


  findById(eventId: string): Promise<Event | null>;

  findAll(): Promise<Event[]>;
}
