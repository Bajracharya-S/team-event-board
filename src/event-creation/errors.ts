export type EventCreationError =
  | { name: "ValidationError"; message: string }
  | { name: "InvalidTimeRangeError"; message: string }
  | { name: "UnauthorizedError"; message: string };

export const ValidationError = (message: string): EventCreationError => ({
  name: "ValidationError",
  message,
});

export const InvalidTimeRangeError = (message: string): EventCreationError => ({
  name: "InvalidTimeRangeError",
  message,
});

export const UnauthorizedError = (message: string): EventCreationError => ({
  name: "UnauthorizedError",
  message,
});
