import type { Request, Response } from "express";
import type { IEventCreationService, CreateEventInput } from "./EventCreationService";
import { VALID_CATEGORIES } from "./EventCreationService";
import type { ILoggingService } from "../service/LoggingService";
import {
  getAuthenticatedUser,
  recordPageView,
  type AppSessionStore,
} from "../session/AppSession";

export interface IEventCreationController {
  showForm(req: Request, res: Response): Promise<void>;
  handleCreate(req: Request, res: Response): Promise<void>;
}

class EventCreationController implements IEventCreationController {
  constructor(
    private readonly service: IEventCreationService,
    private readonly logger: ILoggingService,
  ) {}

  async showForm(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const session = recordPageView(store);

    this.logger.info("GET /events/new");
    res.render("events/new", {
      session,
      categories: VALID_CATEGORIES,
      formData: null,
      formError: null,
    });
  }

  async handleCreate(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.status(401).render("partials/error", {
        message: "Please log in to continue.",
        layout: false,
      });
      return;
    }

    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    const rawCapacity = req.body.capacity ? Number(req.body.capacity) : null;

    const input: CreateEventInput = {
      title: typeof req.body.title === "string" ? req.body.title : "",
      description: typeof req.body.description === "string" ? req.body.description : "",
      location: typeof req.body.location === "string" ? req.body.location : "",
      category: typeof req.body.category === "string" ? req.body.category : "",
      startTime,
      endTime,
      capacity: rawCapacity,
    };

    this.logger.info(`POST /events — user=${user.userId}`);

    const result = await this.service.createEvent(input, user.userId, user.role);

    if (result.ok === false) {
      const error = result.value;
      const status = error.name === "UnauthorizedError" ? 403 : 400;

      const session = recordPageView(store);
      res.status(status).render("events/new", {
        session,
        categories: VALID_CATEGORIES,
        formData: req.body,
        formError: error.message,
      });
      return;
    }

    res.redirect(`/home`);
  }
}

export function CreateEventCreationController(
  service: IEventCreationService,
  logger: ILoggingService,
): IEventCreationController {
  return new EventCreationController(service, logger);
}
