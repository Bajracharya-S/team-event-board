export type EventStatus = "draft" | "published" | "cancelled" |"past";
export type EventCategory = "social" | "educational" | "volunteer" | "sports" | "arts";

export interface IEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    category: EventCategory;
    status: EventStatus;

    capacity: number | null;

    startTime: Date;
    endTime: Date;

    organizerName: string;
    attendeeCount: number
    createdAt: Date;
    updatedAt: Date;
}

export type EventDetail = {
    title: string;
    description: string;
    location: string;
    category: EventCategory;
  
    dateTime: Date;
  
    organizerName: string;
  
    attendeeCount: number;
    capacity: number;
  
    status: "draft" | "published" | "cancelled" | "past";
  };