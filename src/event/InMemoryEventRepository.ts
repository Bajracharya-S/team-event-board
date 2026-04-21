import { Ok, Err, type Result } from "../lib/result";
import type { IEvent, EventStatus } from "./Event";
import type { IEventRepository, EventRepositoryError } from "./EventRepository";

const UnexpectedError = (message: string): EventRepositoryError => ({
  name: "UnexpectedError",
  message,
});

const now = new Date();
const past = (daysAgo: number): Date => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
const future = (daysFromNow: number): Date =>
  new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

const SEED_EVENTS: IEvent[] = [
  {
    id: "event-1",
    title: "Team Kickoff 2024",
    description: "Annual team kickoff meeting.",
    location: "Main Hall",
    category: "educational",
    status: "published",
    capacity: null,
    startDatetime: past(10),
    endDatetime: past(9),
    organizerId: "user-staff",
    createdAt: past(20),
    updatedAt: past(10),
  },
  {
    id: "event-2",
    title: "Hackathon Spring",
    description: "24-hour hackathon open to all members.",
    location: "Lab Room B",
    category: "educational",
    status: "published",
    capacity: 30,
    startDatetime: past(5),
    endDatetime: past(4),
    organizerId: "user-staff",
    createdAt: past(15),
    updatedAt: past(5),
  },
  {
    id: "event-3",
    title: "Workshop: Intro to TypeScript",
    description: "Beginner-friendly TypeScript workshop.",
    location: "Room 101",
    category: "educational",
    status: "published",
    capacity: 20,
    startDatetime: past(2),
    endDatetime: past(1),
    organizerId: "user-staff",
    createdAt: past(10),
    updatedAt: past(2),
  },
  {
    id: "event-4",
    title: "Game Night",
    description: "Board games and fun for the whole team.",
    location: "Common Room",
    category: "social",
    status: "published",
    capacity: null,
    startDatetime: future(3),
    endDatetime: future(3),
    organizerId: "user-staff",
    createdAt: past(5),
    updatedAt: past(5),
  },
  {
    id: "event-5",
    title: "Sprint Planning",
    description: "Sprint 2 planning session.",
    location: "Online",
    category: "educational",
    status: "draft",
    capacity: null,
    startDatetime: future(7),
    endDatetime: future(7),
    organizerId: "user-staff",
    createdAt: past(1),
    updatedAt: past(1),
  },
];

class InMemoryEventRepository implements IEventRepository {
  private readonly events: Map<string, IEvent>;
  private nextEventId: number;

  constructor(seed: IEvent[]) {
    this.events = new Map(seed.map((e) => [e.id, { ...e }]));
    
    this.nextEventId = 1;
    for (const event of seed) {
      const match = event.id.match(/event-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= this.nextEventId) {
          this.nextEventId = num + 1;
        }
      }
    }
  }

  generateEventId(): string {
    return `event-${this.nextEventId++}`;
  }

  async findAll(): Promise<Result<IEvent[], EventRepositoryError>> {
    try {
      return Ok([...this.events.values()]);
    } catch {
      return Err(UnexpectedError("Unable to retrieve events."));
    }
  }

  async findById(id: string): Promise<Result<IEvent | null, EventRepositoryError>> {
    try {
      return Ok(this.events.get(id) ?? null);
    } catch {
      return Err(UnexpectedError("Unable to retrieve event."));
    }
  }

  async findByStatus(status: EventStatus): Promise<Result<IEvent[], EventRepositoryError>> {
    try {
      const matches = [...this.events.values()].filter((e) => e.status === status);
      return Ok(matches);
    } catch {
      return Err(UnexpectedError("Unable to retrieve events by status."));
    }
  }

  async create(event: IEvent): Promise<Result<IEvent, EventRepositoryError>> {
    try {
      this.events.set(event.id, { ...event });
      return Ok({ ...event });
    } catch {
      return Err(UnexpectedError("Unable to create event."));
    }
  }

  async updateStatus(
    id: string,
    status: EventStatus,
  ): Promise<Result<IEvent | null, EventRepositoryError>> {
    try {
      const event = this.events.get(id);
      if (!event) {
        return Ok(null);
      }
      const updated: IEvent = { ...event, status, updatedAt: new Date() };
      this.events.set(id, updated);
      return Ok(updated);
    } catch {
      return Err(UnexpectedError("Unable to update event status."));
    }
  }
}

export function CreateInMemoryEventRepository(): IEventRepository {
  return new InMemoryEventRepository([...SEED_EVENTS]);
}
