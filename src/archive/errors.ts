export type ArchiveError =
  | { name: "InvalidNowError"; message: string }
  | { name: "UnauthorizedError"; message: string }
  | { name: "InvalidCategoryError"; message: string }
  | { name: "UnexpectedError"; message: string };

export const InvalidNowError = (message: string): ArchiveError => ({
  name: "InvalidNowError",
  message,
});

export const UnauthorizedError = (message: string): ArchiveError => ({
  name: "UnauthorizedError",
  message,
});

export const InvalidCategoryError = (message: string): ArchiveError => ({
  name: "InvalidCategoryError",
  message,
});

export const UnexpectedError = (message: string): ArchiveError => ({
  name: "UnexpectedError",
  message,
});
