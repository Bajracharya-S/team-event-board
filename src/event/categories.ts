export const EVENT_CATEGORIES = [
  "social",
  "educational",
  "volunteer",
  "sports",
  "arts",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
