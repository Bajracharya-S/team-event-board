import { Request, Response } from "express";
import { IEventListService } from "./EventListService";

export interface IEventListController {
  listEvents(req: Request, res: Response): Promise<void>;
}

class EventListController implements IEventListController {
  constructor(private readonly eventListService: IEventListService) {}

  async listEvents(req: Request, res: Response): Promise<void> {
    const filters = {
      query: typeof req.query.query === "string" ? req.query.query : "",
      category: typeof req.query.category === "string" ? req.query.category : "",
      timeframe: typeof req.query.timeframe === "string" ? req.query.timeframe : "all",
    };

    const result = await this.eventListService.listEvents(filters);

    if (result.ok === false) {
      res.status(400).render("partials/error", {
        message: result.value.message,
        layout: false,
      });
      return;
    }

    res.render("events/list", {
      events: result.value,
      filters,
    });
  }
}

export function CreateEventListController(
  eventListService: IEventListService
): IEventListController {
  return new EventListController(eventListService);
}