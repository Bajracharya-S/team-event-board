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

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  return CreateApp(authController, archiveController, resolvedLogger);
}
