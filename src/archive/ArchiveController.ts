import type { Request, Response } from "express";
import type { IArchiveService } from "./ArchiveService";
import type { ILoggingService } from "../service/LoggingService";
import { VALID_CATEGORIES } from "./ArchiveService";
import { getAuthenticatedUser, recordPageView } from "../session/AppSession";
import type { AppSessionStore } from "../session/AppSession";

export interface IArchiveController {
  showArchive(req: Request, res: Response): Promise<void>;
}

class ArchiveController implements IArchiveController {
  constructor(
    private readonly archiveService: IArchiveService,
    private readonly logger: ILoggingService,
  ) {}

  async showArchive(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const browserSession = recordPageView(store);
    const user = getAuthenticatedUser(store);
    const userId = user?.userId ?? "";

    const category =
      typeof req.query.category === "string" && req.query.category.trim()
        ? req.query.category.trim()
        : undefined;

    this.logger.info(`GET /archive userId=${userId} category=${category ?? "none"}`);

    const archiveResult = await this.archiveService.archiveExpiredEvents(new Date());
    if (archiveResult.ok === false) {
      this.logger.error(`archiveExpiredEvents failed: ${archiveResult.value.message}`);
      res.status(500).render("partials/error", {
        message: "Unexpected error while processing the archive.",
        layout: false,
      });
      return;
    }

    const eventsResult = await this.archiveService.getArchivedEvents(userId, category);
    if (eventsResult.ok === false) {
      const error = eventsResult.value;

      if (error.name === "UnauthorizedError") {
        res.status(401).render("partials/error", { message: error.message, layout: false });
        return;
      }

      if (error.name === "InvalidCategoryError") {
        res.status(400).render("partials/error", { message: error.message, layout: false });
        return;
      }

      res.status(500).render("partials/error", {
        message: "Unexpected error while loading the archive.",
        layout: false,
      });
      return;
    }

    res.render("archive/index", {
      events: eventsResult.value,
      selectedCategory: category ?? "",
      validCategories: VALID_CATEGORIES,
      session: browserSession,
    });
  }
}

export function CreateArchiveController(
  archiveService: IArchiveService,
  logger: ILoggingService,
): IArchiveController {
  return new ArchiveController(archiveService, logger);
}
