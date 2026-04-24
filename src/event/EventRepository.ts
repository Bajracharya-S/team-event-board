import type { IEvent, EventStatus } from "./Event";
import type { Result } from "../lib/result";

export type EventRepositoryError = { name: "UnexpectedError"; message: string };

export interface IEventRepository {
  findAll(): Promise<Result<IEvent[], EventRepositoryError>>;
  findById(id: string): Promise<Result<IEvent | null, EventRepositoryError>>;
  findByStatus(status: EventStatus): Promise<Result<IEvent[], EventRepositoryError>>;
  create(event: IEvent): Promise<Result<IEvent, EventRepositoryError>>;
  updateStatus(id: string, status: EventStatus): Promise<Result<IEvent | null, EventRepositoryError>>;
  generateEventId(): string;
}
