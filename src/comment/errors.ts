export type CommentError =
  | { name: "EventNotFoundError"; message: string }
  | { name: "EventNotPublishedError"; message: string }
  | { name: "UnauthorizedError"; message: string }
  | { name: "InvalidContentError"; message: string }
  | { name: "CommentNotFoundError"; message: string }
  | { name: "UnexpectedError"; message: string };

export const EventNotFoundError = (message: string): CommentError => ({
  name: "EventNotFoundError",
  message,
});

export const EventNotPublishedError = (message: string): CommentError => ({
  name: "EventNotPublishedError",
  message,
});

export const UnauthorizedError = (message: string): CommentError => ({
  name: "UnauthorizedError",
  message,
});

export const InvalidContentError = (message: string): CommentError => ({
  name: "InvalidContentError",
  message,
});

export const CommentNotFoundError = (message: string): CommentError => ({
  name: "CommentNotFoundError",
  message,
});

export const UnexpectedError = (message: string): CommentError => ({
  name: "UnexpectedError",
  message,
});
