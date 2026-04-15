import { Ok, Err, type Result } from "../lib/result";
import type { IComment } from "./Comment";
import type { ICommentRepository, CommentRepositoryError } from "./CommentRepository";

const UnexpectedError = (message: string): CommentRepositoryError => ({
  name: "UnexpectedError",
  message,
});

class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments: Map<string, IComment> = new Map();

  async findById(commentId: string): Promise<Result<IComment | null, CommentRepositoryError>> {
    try {
      return Ok(this.comments.get(commentId) ?? null);
    } catch {
      return Err(UnexpectedError("Unable to retrieve comment."));
    }
  }

  async findByEventId(eventId: string): Promise<Result<IComment[], CommentRepositoryError>> {
    try {
      const matches = [...this.comments.values()]
        .filter((c) => c.eventId === eventId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      return Ok(matches);
    } catch {
      return Err(UnexpectedError("Unable to retrieve comments."));
    }
  }

  async create(comment: IComment): Promise<Result<IComment, CommentRepositoryError>> {
    try {
      this.comments.set(comment.id, { ...comment });
      return Ok({ ...comment });
    } catch {
      return Err(UnexpectedError("Unable to create comment."));
    }
  }

  async delete(commentId: string): Promise<Result<boolean, CommentRepositoryError>> {
    try {
      return Ok(this.comments.delete(commentId));
    } catch {
      return Err(UnexpectedError("Unable to delete comment."));
    }
  }
}

export function CreateInMemoryCommentRepository(): ICommentRepository {
  return new InMemoryCommentRepository();
}
