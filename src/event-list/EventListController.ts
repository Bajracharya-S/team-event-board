import { Request, Response } from "express";
import { IEventListService } from "./EventListService";
import type { IAppBrowserSession, IAuthenticatedUserSession } from "../session/AppSession";

export interface IEventListController {
  listEvents(
    req: Request,
    res: Response,
    session: IAppBrowserSession,
    currentUser: IAuthenticatedUserSession,
  ): Promise<void>;
}

class EventListController implements IEventListController {
  constructor(private readonly eventListService: IEventListService) {}

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

    const result = await this.eventListService.listEvents(filters);

    if (!result.ok) {
      const status = result.value.name === "UnexpectedError" ? 500 : 400;

      res.status(status).render("partials/error", {
        message: result.value.message,
        layout: false,
      });
      return;
    }

    if (this.isHtmxRequest(req)) {
      res.render("events/list", {
        events: result.value,
        filters,
        currentUser,
        layout: false,
      });
      return;
    }

    res.render("events/index", {
      session,
      currentUser,
      events: result.value,
      filters,
    });
  }
}

export function CreateEventListController(
  eventListService: IEventListService,
): IEventListController {
  return new EventListController(eventListService);
}