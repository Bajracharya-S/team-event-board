export type RSVPError =
  | { name: "EventNotFoundError"; message: string }
  | { name: "UnauthorizedError"; message: string }
  | { name: "EventClosedError"; message: string }
  | { name: "CapacityCalculationError"; message: string };

export const EventNotFoundError = (message: string): RSVPError => ({
  name: "EventNotFoundError",
  message,
});

export const UnauthorizedError = (message: string): RSVPError => ({
  name: "UnauthorizedError",
  message,
});

export const EventClosedError = (message: string): RSVPError => ({
  name: "EventClosedError",
  message,
});

export const CapacityCalculationError = (message: string): RSVPError => ({
  name: "CapacityCalculationError",
  message,
});
