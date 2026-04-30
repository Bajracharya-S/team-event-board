import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = dbUrl.replace("file:", "");
const resolvedPath = path.resolve(dbPath);
const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const past = (daysAgo: number): Date =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
const future = (daysFromNow: number): Date =>
  new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

async function main() {
    await prisma.event.deleteMany();
  
    await prisma.event.createMany({
      data: [
        {
          id: "event-1",
          title: "Team Kickoff 2024",
          description: "Annual team kickoff meeting.",
          location: "Main Hall",
          category: "meeting",
          status: "published",
          capacity: null,
          startDatetime: past(10),
          endDatetime: past(9),
          organizerId: "user-staff",
        },
        {
          id: "event-2",
          title: "Hackathon Spring",
          description: "24-hour hackathon open to all members.",
          location: "Lab Room B",
          category: "hackathon",
          status: "published",
          capacity: 30,
          startDatetime: past(5),
          endDatetime: past(4),
          organizerId: "user-staff",
        },
        {
          id: "event-3",
          title: "Workshop: Intro to TypeScript",
          description: "Beginner-friendly TypeScript workshop.",
          location: "Room 101",
          category: "workshop",
          status: "published",
          capacity: 20,
          startDatetime: past(2),
          endDatetime: past(1),
          organizerId: "user-staff",
        },
        {
          id: "event-4",
          title: "Game Night",
          description: "Board games and fun for the whole team.",
          location: "Common Room",
          category: "social",
          status: "published",
          capacity: null,
          startDatetime: future(3),
          endDatetime: future(3),
          organizerId: "user-staff",
        },
        {
          id: "event-5",
          title: "Sprint Planning",
          description: "Sprint 2 planning session.",
          location: "Online",
          category: "meeting",
          status: "draft",
          capacity: null,
          startDatetime: future(7),
          endDatetime: future(7),
          organizerId: "user-staff",
        },
      ],
    });
  
    console.log("Seeded events successfully.");
}
  
main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });