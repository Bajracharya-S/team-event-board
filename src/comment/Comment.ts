export interface IComment {
  id: string;
  eventId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
}
