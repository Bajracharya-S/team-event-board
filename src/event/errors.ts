export type EventError =
  | { kind: "EventNotFound"; message: string }
  | { kind: "Forbidden"; message: string }
  | { kind: "InvalidTransition"; message: string }
  | { kind: "Unexpected"; message: string };

export const EventNotFoundError = (): EventError => ({
  kind: "EventNotFound",
  message: "Event not found.",
});

export const ForbiddenError = (): EventError => ({
  kind: "Forbidden",
  message: "You do not have permission to perform this action.",
});

export const InvalidTransitionError = (message: string): EventError => ({
  kind: "InvalidTransition",
  message,
});

export const UnexpectedEventError = (message: string): EventError => ({
  kind: "Unexpected",
  message,
});