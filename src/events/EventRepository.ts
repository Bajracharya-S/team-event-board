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

    async findById(id: string): Promise<Event | null> {
        return this.events.find(e => e.id === id) ?? null;
    }

    async findAll(): Promise<Event[]> {
        return this.events;
    }
}