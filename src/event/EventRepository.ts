import type { Result } from "../lib/result";
import type { IEvent, EventStatus } from "./Event";
import type { EventError } from "./errors";

export interface IEventRepository {
  findById(id: string): Promise<Result<IEvent | null, EventError>>;
  updateStatus(id: string, status: EventStatus): Promise<Result<IEvent, EventError>>;
}