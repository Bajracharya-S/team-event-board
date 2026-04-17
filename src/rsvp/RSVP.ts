export type RSVPStatus = "going" | "waitlisted" | "cancelled";

export interface IRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  createdAt: Date;
}
