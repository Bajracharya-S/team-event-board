import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date();
const past = (daysAgo: number): Date =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
const future = (daysFromNow: number): Date =>
  new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);