import type { Event } from "./event";

export interface IEventRepository {
  create(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findAll(): Promise<Event[]>;
  update(event: Event): Promise<Event>;
}

export class InMemoryEventRepository implements IEventRepository {
    private events: Event[] = [];
  
    async create(event: Event): Promise<Event> {
      this.events.push(event);
      return event;
    }
}