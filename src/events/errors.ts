
export interface ValidationError {
  type: "ValidationError";
  message: string;
}

export interface InvalidTimeRangeError {
  type: "InvalidTimeRangeError";
  message: string;
}

export interface UnauthorizedError {
  type: "UnauthorizedError";
  message: string;
}


export type EventCreationError =
  | ValidationError
  | InvalidTimeRangeError
  | UnauthorizedError;


export function createValidationError(message: string): ValidationError {
  return { type: "ValidationError", message };
}

export function createInvalidTimeRangeError(message: string): InvalidTimeRangeError {
  return { type: "InvalidTimeRangeError", message };
}

export function createUnauthorizedError(message: string): UnauthorizedError {
  return { type: "UnauthorizedError", message };
}
