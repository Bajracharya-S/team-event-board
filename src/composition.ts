import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

import { InMemorySavedEventRepository } from "./saveForLater/SaveRepo";
import { CreateSaveService } from "./saveForLater/SaveService";
import { CreateSaveController } from "./saveForLater/SaveController";

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  const savedEventRepo = new InMemorySavedEventRepository();
  const saveService = CreateSaveService(savedEventRepo);
  const saveController = CreateSaveController(saveService, resolvedLogger);

  

  return CreateApp(authController, saveController, resolvedLogger);
}
