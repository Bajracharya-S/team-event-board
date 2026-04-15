export type EventStatus = "draft" | "published" | "cancelled" |"past"
export type EventCategory = "social" | "educational" | "volunteer" | "sports" | "arts";

export interface IEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    category: EventCategory;
    status: EventStatus;
    capacity: number | null;
    startDatetime: Date;
    endDatetime: Date;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
}