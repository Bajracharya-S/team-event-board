import type { Request, Response } from "express";
import type { IRSVPService } from "./RSVPService";
import type { ILoggingService } from "../service/LoggingService";
import {
  getAuthenticatedUser,
  type AppSessionStore,
} from "../session/AppSession";

export interface IRSVPController {
  toggle(req: Request, res: Response): Promise<void>;
}

class RSVPController implements IRSVPController {
  constructor(
    private readonly service: IRSVPService,
    private readonly logger: ILoggingService,
  ) {}

  async toggle(req: Request, res: Response): Promise<void> {
    const store = req.session as AppSessionStore;
    const user = getAuthenticatedUser(store);

    if (!user) {
      res.status(401).render("partials/error", {
        message: "Please log in to continue.",
        layout: false,
      });
      return;
    }

    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";

    this.logger.info(`POST /events/${eventId}/rsvp — user=${user.userId}`);

    const result = await this.service.toggleRSVP(eventId, user.userId, user.role);

    if (result.ok === false) {
      const error = result.value;
      const status =
        error.name === "EventNotFoundError" ? 404 :
        error.name === "UnauthorizedError" ? 403 :
        error.name === "EventClosedError" ? 400 :
        error.name === "CapacityCalculationError" ? 500 : 500;

      res.status(status).render("partials/error", {
        message: error.message,
        layout: false,
      });
      return;
    }

    const rsvp = result.value;
    res.render("rsvp/status", {
      status: rsvp.status,
      attendeeCount: rsvp.attendeeCount,
      eventId,
      layout: false,
    });
  }
}

export function CreateRSVPController(
  service: IRSVPService,
  logger: ILoggingService,
): IRSVPController {
  return new RSVPController(service, logger);
}
