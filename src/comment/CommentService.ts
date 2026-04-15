import { Ok, Err, type Result } from "../lib/result";
import { randomUUID } from "node:crypto";
import type { IComment } from "./Comment";
import type { ICommentRepository } from "./CommentRepository";
import type { IEventRepository } from "../event/EventRepository";
import {
  EventNotFoundError,
  EventNotPublishedError,
  UnauthorizedError,
  InvalidContentError,
  CommentNotFoundError,
  UnexpectedError,
  type CommentError,
} from "./errors";

const MAX_CONTENT_LENGTH = 500;

export interface ICommentService {
  createComment(
    eventId: string,
    userId: string,
    authorDisplayName: string,
    content: string,
  ): Promise<Result<IComment, CommentError>>;
  getComments(eventId: string): Promise<Result<IComment[], CommentError>>;
  deleteComment(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<Result<string, CommentError>>;
}

class CommentService implements ICommentService {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async createComment(
    eventId: string,
    userId: string,
    authorDisplayName: string,
    content: string,
  ): Promise<Result<IComment, CommentError>> {
    if (!userId || !userId.trim()) {
      return Err(UnauthorizedError("You must be logged in to post a comment."));
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return Err(InvalidContentError("Comment cannot be empty."));
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      return Err(
        InvalidContentError(`Comment cannot exceed ${MAX_CONTENT_LENGTH} characters.`),
      );
    }

    const eventResult = await this.eventRepo.findById(eventId);
    if (eventResult.ok === false) {
      return Err(UnexpectedError(eventResult.value.message));
    }
    if (!eventResult.value) {
      return Err(EventNotFoundError("Event does not exist."));
    }
    if (eventResult.value.status !== "published") {
      return Err(EventNotPublishedError("Comments can only be posted on published events."));
    }

    const comment: IComment = {
      id: randomUUID(),
      eventId,
      authorId: userId,
      authorDisplayName,
      content: trimmed,
      createdAt: new Date(),
    };

    const createResult = await this.commentRepo.create(comment);
    if (createResult.ok === false) {
      return Err(UnexpectedError(createResult.value.message));
    }

    return Ok(createResult.value);
  }

  async getComments(eventId: string): Promise<Result<IComment[], CommentError>> {
    const eventResult = await this.eventRepo.findById(eventId);
    if (eventResult.ok === false) {
      return Err(UnexpectedError(eventResult.value.message));
    }
    if (!eventResult.value) {
      return Err(EventNotFoundError("Event does not exist."));
    }
    if (eventResult.value.status !== "published") {
      return Err(EventNotPublishedError("Comments are only visible on published events."));
    }

    const commentsResult = await this.commentRepo.findByEventId(eventId);
    if (commentsResult.ok === false) {
      return Err(UnexpectedError(commentsResult.value.message));
    }

    return Ok(commentsResult.value);
  }

  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<Result<string, CommentError>> {
    if (!userId || !userId.trim()) {
      return Err(UnauthorizedError("You must be logged in to delete a comment."));
    }

    const commentResult = await this.commentRepo.findById(commentId);
    if (commentResult.ok === false) {
      return Err(UnexpectedError(commentResult.value.message));
    }
    if (!commentResult.value) {
      return Err(CommentNotFoundError("Comment does not exist."));
    }

    const comment = commentResult.value;

    if (userRole === "admin") {
      const deleteResult = await this.commentRepo.delete(commentId);
      if (deleteResult.ok === false) {
        return Err(UnexpectedError(deleteResult.value.message));
      }
      return Ok(commentId);
    }

    if (comment.authorId === userId) {
      const deleteResult = await this.commentRepo.delete(commentId);
      if (deleteResult.ok === false) {
        return Err(UnexpectedError(deleteResult.value.message));
      }
      return Ok(commentId);
    }

    const eventResult = await this.eventRepo.findById(comment.eventId);
    if (eventResult.ok === false) {
      return Err(UnexpectedError(eventResult.value.message));
    }
    if (eventResult.value && eventResult.value.organizerId === userId) {
      const deleteResult = await this.commentRepo.delete(commentId);
      if (deleteResult.ok === false) {
        return Err(UnexpectedError(deleteResult.value.message));
      }
      return Ok(commentId);
    }

    return Err(
      UnauthorizedError("You do not have permission to delete this comment."),
    );
  }
}

export function CreateCommentService(
  commentRepo: ICommentRepository,
  eventRepo: IEventRepository,
): ICommentService {
  return new CommentService(commentRepo, eventRepo);
}
