import type { Response } from 'express'
import type { IAppBrowserSession } from '../session/AppSession'
import type { ILoggingService } from '../service/LoggingService'
import type { ISaveService} from './SaveService'
import { isSavedEventError } from './SaveService'

export interface ISaveController {
  toggleSaveEvent(res: Response, eventId: number, session: IAppBrowserSession): Promise<void>
}

class SaveController implements ISaveController {
  constructor(
    private readonly service: ISaveService,
    private readonly logger: ILoggingService,
  ) {}

  private mapErrorStatus(errorName: string): number {
    if (errorName === 'EventNotFound') return 404
    if (errorName === 'EventCancelled') return 422
    if (errorName === 'Unauthorized') return 403
    return 500
  }

  async toggleSaveEvent(
    res: Response,
    eventId: number,
    session: IAppBrowserSession,
  ): Promise<void> {
    const user = session.authenticatedUser
    if (!user) {
      res.status(401).render('partials/error', {
        message: 'You must be logged in to save events.',
        layout: false,
      })
      return
    }

    this.logger.info(`User ${user.userId} toggling save on event ${eventId}`)
    const result = await this.service.toggleSaveEvent(user.userId, eventId)

    if (!result.ok) {
      const status = isSavedEventError(result.value)
        ? this.mapErrorStatus(result.value.name)
        : 500
      const message = isSavedEventError(result.value)
        ? result.value.message
        : 'Unable to save event.'
      res.status(status).render('partials/error', { message, layout: false })
      return
    }

    this.logger.info(`Event ${eventId} ${result.value} for user ${user.userId}`)
    res.redirect(`/events/${eventId}`)
  }
}

export function CreateSaveController(
  service: ISaveService,
  logger: ILoggingService,
): ISaveController {
  return new SaveController(service, logger)
}