import type { Response } from 'express'
import type { IAppBrowserSession } from '../session/AppSession'
import type { ILoggingService } from '../service/LoggingService'
import type { ISaveService} from './SaveService'
import { isSavedEventError } from './SaveService'

export interface ISaveController {
  toggleSaveEvent(res: Response, eventId: string, session: IAppBrowserSession): Promise<void>
    showSavedList(res: Response, session: IAppBrowserSession): Promise<void>
    getSavedEventIds(userId: string): Promise<string[]>
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
  eventId: string,
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

  const isSaved = result.value === 'saved'
  res.render('saveButton', { eventId, isSaved, layout: false })
}

  async showSavedList(res: Response, session: IAppBrowserSession): Promise<void> {
  const user = session.authenticatedUser
  if (!user) {
    res.redirect('/login')
    return
  }

  this.logger.info(`Showing saved list for user ${user.userId}`)
  const savedEvents = await this.service.getSavedEvents(user.userId)
  res.render('events/save', { savedEvents, session })
}

async getSavedEventIds(userId: string): Promise<string[]> {
  const saved = await this.service.getSavedEvents(userId)
  return saved.map(e => e.eventId)
}
}

export function CreateSaveController(
  service: ISaveService,
  logger: ILoggingService,
): ISaveController {
  return new SaveController(service, logger)
}