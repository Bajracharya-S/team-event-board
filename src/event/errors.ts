export type EventError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }
  | { name: "InvalidTransition"; message: string }
  | { name: "Unexpected"; message: string };

export const EventNotFoundError = (): EventError => ({
  name: "EventNotFound",
  message: "Event not found.",
});

export const ForbiddenError = (): EventError => ({
  name: "Forbidden",
  message: "You do not have permission to perform this action.",
});

export const InvalidTransitionError = (message: string): EventError => ({
  name: "InvalidTransition",
  message,
});

export const UnexpectedEventError = (message: string): EventError => ({
  name: "Unexpected",
  message,
});