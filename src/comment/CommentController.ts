import type { Request, Response } from "express";
import type { ICommentService } from "./CommentService";
import type { ILoggingService } from "../service/LoggingService";
import { getAuthenticatedUser } from "../session/AppSession";
import type { AppSessionStore } from "../session/AppSession";

export interface ICommentController {
  postComment(req: Request, res: Response): Promise<void>;
  deleteComment(req: Request, res: Response): Promise<void>;
}

class CommentController implements ICommentController {
  constructor(
    private readonly commentService: ICommentService,
    private readonly logger: ILoggingService,
  ) {}

  private isHtmxRequest(req: Request): boolean {
    return req.get("HX-Request") === "true";
  }

  private retargetHtmxError(res: Response, selector: string): void {
    res.set("HX-Retarget", selector);
    res.set("HX-Reswap", "innerHTML");
  }

  async postComment(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);
    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
    const content = typeof req.body.content === "string" ? req.body.content : "";

    this.logger.info(`POST /events/${eventId}/comments userId=${user?.userId ?? "unauthenticated"}`);

    const result = await this.commentService.createComment(
      eventId,
      user?.userId ?? "",
      user?.displayName ?? "",
      content,
    );

    if (result.ok === false) {
      const error = result.value;

      if (this.isHtmxRequest(req)) {
        this.retargetHtmxError(res, "#comment-errors");
      }

      if (error.name === "UnauthorizedError") {
        res.status(401).render("partials/error", { message: error.message, layout: false });
        return;
      }
      if (error.name === "InvalidContentError") {
        res.status(400).render("partials/error", { message: error.message, layout: false });
        return;
      }
      if (error.name === "EventNotFoundError") {
        res.status(404).render("partials/error", { message: error.message, layout: false });
        return;
      }
      if (error.name === "EventNotPublishedError") {
        res.status(409).render("partials/error", { message: error.message, layout: false });
        return;
      }

      res.status(500).render("partials/error", {
        message: "Unexpected error while posting comment.",
        layout: false,
      });
      return;
    }

    const commentsResult = await this.commentService.getComments(eventId);
    const comments = commentsResult.ok ? commentsResult.value.comments : [];
    const eventOrganizerId = commentsResult.ok ? commentsResult.value.eventOrganizerId : "";

    res.status(201).render("partials/comment-list", {
      comments,
      currentUserId: user?.userId ?? "",
      currentUserRole: user?.role ?? "",
      eventOrganizerId,
      layout: false,
    });
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);
    const commentId = typeof req.params.commentId === "string" ? req.params.commentId : "";
    const eventId = typeof req.body.eventId === "string" ? req.body.eventId : "";

    this.logger.info(`POST /comments/${commentId}/delete userId=${user?.userId ?? "unauthenticated"}`);

    const result = await this.commentService.deleteComment(
      commentId,
      user?.userId ?? "",
      user?.role ?? "",
    );

    if (result.ok === false) {
      const error = result.value;

      if (this.isHtmxRequest(req)) {
        this.retargetHtmxError(res, "#comment-errors");
      }

      if (error.name === "UnauthorizedError") {
        res.status(403).render("partials/error", { message: error.message, layout: false });
        return;
      }
      if (error.name === "CommentNotFoundError") {
        res.status(404).render("partials/error", { message: error.message, layout: false });
        return;
      }

      res.status(500).render("partials/error", {
        message: "Unexpected error while deleting comment.",
        layout: false,
      });
      return;
    }

    const commentsResult = await this.commentService.getComments(eventId);
    const comments = commentsResult.ok ? commentsResult.value.comments : [];
    const eventOrganizerId = commentsResult.ok ? commentsResult.value.eventOrganizerId : "";

    res.status(200).render("partials/comment-list", {
      comments,
      currentUserId: user?.userId ?? "",
      currentUserRole: user?.role ?? "",
      eventOrganizerId,
      layout: false,
    });
  }
}

export function CreateCommentController(
  commentService: ICommentService,
  logger: ILoggingService,
): ICommentController {
  return new CommentController(commentService, logger);
}
