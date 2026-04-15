import type { IComment } from "./Comment";
import type { Result } from "../lib/result";

export type CommentRepositoryError = { name: "UnexpectedError"; message: string };

export interface ICommentRepository {
  findById(commentId: string): Promise<Result<IComment | null, CommentRepositoryError>>;
  findByEventId(eventId: string): Promise<Result<IComment[], CommentRepositoryError>>;
  create(comment: IComment): Promise<Result<IComment, CommentRepositoryError>>;
  delete(commentId: string): Promise<Result<boolean, CommentRepositoryError>>;
}
