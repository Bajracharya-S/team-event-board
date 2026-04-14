
export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  status: "draft" | "published" | "cancelled" | "past";
  organizerId: string;
  createdAt: Date;
}

export interface CreateEventInput {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
}
