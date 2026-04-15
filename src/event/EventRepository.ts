import type { Result } from "../lib/result";
import type { IEvent, EventStatus, EventDetail } from "./Event";
import type { EventError } from "./errors";

export interface IEventRepository {
  findById(id: string): Promise<Result<IEvent | null, EventError>>;
  updateStatus(id: string, status: EventStatus): Promise<Result<IEvent, EventError>>;
  //Feature 2
  getEvent(eventId: string, requesterId: string): Promise<Result<EventDetail, EventError>>
  //Feature 5
  publishEvent(eventId: string, requesterId: string): Promise<Result<IEvent, EventError>>;
  cancelEvent(eventId: string, requesterId: string): Promise<Result<IEvent, EventError>>;
}