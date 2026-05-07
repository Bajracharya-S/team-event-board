import { Request, Response } from "express";
import { IEventListService } from "./EventListService";
import type { IAppBrowserSession, IAuthenticatedUserSession } from "../session/AppSession";
import type { ISaveService } from "../saveForLater/SaveService";

export interface IEventListController {
  listEvents(
    req: Request,
    res: Response,
    session: IAppBrowserSession,
    currentUser: IAuthenticatedUserSession,
  ): Promise<void>;
}

class EventListController implements IEventListController {
  constructor(
    private readonly eventListService: IEventListService,
    private readonly saveService: ISaveService,
  ) {}

  private isHtmxRequest(req: Request): boolean {
    return req.get("HX-Request") === "true";
  }

  async listEvents(
    req: Request,
    res: Response,
    session: IAppBrowserSession,
    currentUser: IAuthenticatedUserSession,
  ): Promise<void> {
    const filters = {
      query: typeof req.query.query === "string" ? req.query.query : "",
      category: typeof req.query.category === "string" ? req.query.category : "",
      timeframe: typeof req.query.timeframe === "string" ? req.query.timeframe : "all",
    };

    const result = await this.eventListService.listEvents(filters, currentUser.role);

    if (result.ok === false) {
      const error = result.value;
      const status = error.name === "UnexpectedError" ? 500 : 400;
      res.status(status).render("partials/error", {
        message: error.message,
        layout: false,
      });
      return;
    }

    const savedEventIds =
      currentUser.role === "user"
        ? await this.saveService.getSavedEvents(currentUser.userId).then(s => s.map(e => e.savedEvent.eventId))
        : [];

    if (this.isHtmxRequest(req)) {
      res.render("events/list", {
        events: result.value,
        filters,
        currentUser,
        savedEventIds,
        layout: false,
      });
      return;
    }

    res.render("events/index", {
      session,
      currentUser,
      events: result.value,
      filters,
      savedEventIds,
    });
  }
}

export function CreateEventListController(
  eventListService: IEventListService,
  saveService: ISaveService,
): IEventListController {
  return new EventListController(eventListService, saveService);
}