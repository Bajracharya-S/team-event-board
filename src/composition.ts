import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";

import { CreatePrismaEventRepository } from "./event/PrismaEventRepository";
import type { IEventRepository } from "./event/EventRepository";
import { prisma } from "./lib/prisma";
import { CreateEventService } from "./event/EventService";

import { CreateEventListService } from "./event-list/EventListService";
import { CreateEventListController } from "./event-list/EventListController";

import { CreateArchiveService } from "./archive/ArchiveService";
import { CreateArchiveController } from "./archive/ArchiveController";

import { CreateInMemoryCommentRepository } from "./comment/InMemoryCommentRepository";
import { CreateCommentService } from "./comment/CommentService";
import { CreateCommentController } from "./comment/CommentController";

import { CreateInMemoryRSVPRepository } from "./rsvp/InMemoryRSVPRepository";
import { CreateRSVPService } from "./rsvp/RSVPService";
import { CreateRSVPController } from "./rsvp/RSVPController";

import { CreateEventCreationService } from "./event-creation/EventCreationService";
import { CreateEventCreationController } from "./event-creation/EventCreationController";

import { InMemoryAttendeeRepository } from "./attendee-list/AttendeeRepository";
import { CreateAttendeeService } from "./attendee-list/AttendeeService";
import { CreateAttendeeController } from "./attendee-list/AttendeeController";

import { PrismaSavedEventRepository } from "./saveForLater/SavePrisma";
import { InMemorySavedEventRepository } from "./saveForLater/SaveRepo";
import { CreateSaveService } from "./saveForLater/SaveService";
import { CreateSaveController } from "./saveForLater/saveController";

import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

export let eventRepo: IEventRepository;

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  eventRepo = CreatePrismaEventRepository(prisma);

  const eventService = CreateEventService(eventRepo);
  const eventListService = CreateEventListService(eventRepo);
  const eventListController = CreateEventListController(eventListService);

  const archiveService = CreateArchiveService(eventRepo);
  const archiveController = CreateArchiveController(archiveService, resolvedLogger);

  const commentRepo = CreateInMemoryCommentRepository();
  const commentService = CreateCommentService(commentRepo, eventRepo);
  const commentController = CreateCommentController(commentService, resolvedLogger);

  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  const eventCreationService = CreateEventCreationService(eventRepo);
  const eventCreationController = CreateEventCreationController(
    eventCreationService,
    resolvedLogger,
  );

  const rsvpRepo = CreateInMemoryRSVPRepository();
  const rsvpService = CreateRSVPService(rsvpRepo, eventRepo);
  const rsvpController = CreateRSVPController(rsvpService, resolvedLogger);

  // const savedEventRepo = new InMemorySavedEventRepository();
  const savedEventRepo = new PrismaSavedEventRepository(prisma);
  const saveService = CreateSaveService(savedEventRepo);
  const saveController = CreateSaveController(saveService, resolvedLogger);

  const attendeeRepo = new InMemoryAttendeeRepository(rsvpRepo);
  const attendeeService = CreateAttendeeService(attendeeRepo, eventRepo);
  const attendeeController = CreateAttendeeController(attendeeService, resolvedLogger);

  return CreateApp(
    authController,
    archiveController,
    commentController,
    commentService,
    eventCreationController,
    rsvpController,
    saveController,
    resolvedLogger,
    attendeeController,
    eventService,
    eventRepo,
    authUsers,
    eventListController,
  );
}