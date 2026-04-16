import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateInMemoryEventRepository } from "./event/InMemoryEventRepository";
import type { IEventRepository } from "./event/EventRepository";
import { CreateArchiveService } from "./archive/ArchiveService";
import { CreateArchiveController } from "./archive/ArchiveController";
import { CreateInMemoryCommentRepository } from "./comment/InMemoryCommentRepository";
import { CreateCommentService } from "./comment/CommentService";
import { CreateCommentController } from "./comment/CommentController";
import { CreateEventCreationService } from "./event-creation/EventCreationService";
import { CreateEventCreationController } from "./event-creation/EventCreationController";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

export let eventRepo: IEventRepository;

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Event repository (shared across features)
  eventRepo = CreateInMemoryEventRepository();

  // Archive
  const archiveService = CreateArchiveService(eventRepo);
  const archiveController = CreateArchiveController(archiveService, resolvedLogger);

  // Comments
  const commentRepo = CreateInMemoryCommentRepository();
  const commentService = CreateCommentService(commentRepo, eventRepo);
  const commentController = CreateCommentController(commentService, resolvedLogger);

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // Ft(1) Event Creation
  const eventCreationService = CreateEventCreationService(eventRepo);
  const eventCreationController = CreateEventCreationController(eventCreationService, resolvedLogger);

  return CreateApp(authController, archiveController, commentController, eventCreationController, resolvedLogger);
}
