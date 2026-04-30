import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = dbUrl.replace("file:", "");
const resolvedPath = path.resolve(dbPath);

const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
export const prisma = new PrismaClient({ adapter });
