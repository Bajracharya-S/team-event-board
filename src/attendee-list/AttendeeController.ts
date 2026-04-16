import type { Response } from 'express'
import type { IAppBrowserSession } from '../session/AppSession'
import type { ILoggingService } from '../service/LoggingService'
import type { IAttendeeService, AttendeeError} from './AttendeeService'


export interface IAttendeeController {
  showAttendees(
    res: Response,
    eventId: string,
    session: IAppBrowserSession,
  ): Promise<void>
}

class AttendeeController implements IAttendeeController {
  constructor(
    private readonly service: IAttendeeService,
    private readonly logger: ILoggingService,
  ) {}

  async showAttendees(
    res: Response,
    eventId: string,
    session: IAppBrowserSession,
  ): Promise<void> {
    const user = session.authenticatedUser
    if (!user) {
      res.redirect('/login')
      return
    }

    this.logger.info(`User ${user.userId} requesting attendees for event ${eventId}`)
    const result = await this.service.getGroupedAttendees(eventId, user.userId, user.role)

  if (!result.ok) {
    const error = result.value as AttendeeError
    const status = error.name === 'EventNotFound' ? 404 : 403
    res.status(status).render('partials/error', {
      message: error.message,
      layout: false,
    })
    return
  }

    res.render('events/attendees', {
      eventId,
      attendees: result.value,
      session,
    })
  }
}

export function CreateAttendeeController(
  service: IAttendeeService,
  logger: ILoggingService,
): IAttendeeController {
  return new AttendeeController(service, logger)
}