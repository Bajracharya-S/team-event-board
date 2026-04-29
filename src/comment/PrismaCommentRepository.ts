import { Ok, Err, type Result } from "../lib/result";
import type { IComment } from "./Comment";
import type { ICommentRepository, CommentRepositoryError } from "./CommentRepository";
import type { PrismaClient } from "@prisma/client";

const UnexpectedError = (message: string): CommentRepositoryError => ({
  name: "UnexpectedError",
  message,
});

function toComment(row: {
  id: string;
  eventId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
}): IComment {
  return {
    id: row.id,
    eventId: row.eventId,
    authorId: row.authorId,
    authorDisplayName: row.authorDisplayName,
    content: row.content,
    createdAt: row.createdAt,
  };
}

class PrismaCommentRepository implements ICommentRepository {
  private initialized = false;

  constructor(private readonly db: PrismaClient) {}

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (process.env.NODE_ENV === "test") {
      await this.db.comment.deleteMany();
    }

    this.initialized = true;
  }

  async findById(commentId: string): Promise<Result<IComment | null, CommentRepositoryError>> {
    try {
      await this.initialize();
      const row = await this.db.comment.findUnique({ where: { id: commentId } });
      return Ok(row ? toComment(row) : null);
    } catch {
      return Err(UnexpectedError("Unable to retrieve comment."));
    }
  }

  async findByEventId(eventId: string): Promise<Result<IComment[], CommentRepositoryError>> {
    try {
      await this.initialize();
      const rows = await this.db.comment.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      });

      return Ok(rows.map(toComment));
    } catch {
      return Err(UnexpectedError("Unable to retrieve comments."));
    }
  }

  async create(comment: IComment): Promise<Result<IComment, CommentRepositoryError>> {
    try {
      await this.initialize();
      const row = await this.db.comment.create({
        data: {
          id: comment.id,
          eventId: comment.eventId,
          authorId: comment.authorId,
          authorDisplayName: comment.authorDisplayName,
          content: comment.content,
          createdAt: comment.createdAt,
        },
      });

      return Ok(toComment(row));
    } catch {
      return Err(UnexpectedError("Unable to create comment."));
    }
  }

  async delete(commentId: string): Promise<Result<boolean, CommentRepositoryError>> {
    try {
      await this.initialize();
      const row = await this.db.comment.findUnique({ where: { id: commentId } });
      if (!row) return Ok(false);

      await this.db.comment.delete({ where: { id: commentId } });
      return Ok(true);
    } catch {
      return Err(UnexpectedError("Unable to delete comment."));
    }
  }
}

export function CreatePrismaCommentRepository(db: PrismaClient): ICommentRepository {
  return new PrismaCommentRepository(db);
}
