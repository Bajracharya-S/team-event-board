import { prisma } from "../src/lib/prisma";
const now = new Date();
const past = (days: number) => new Date(now.getTime() - days * 86400000);
const future = (days: number) => new Date(now.getTime() + days * 86400000);
const SEED_EVENTS = [
  { id: "event-1", title: "Team Kickoff 2024", description: "Annual team kickoff meeting.", location: "Main Hall", category: "educational", status: "published", capacity: null, startDatetime: past(10), endDatetime: past(9), organizerId: "user-staff" },
  { id: "event-2", title: "Hackathon Spring", description: "24-hour hackathon open to all members.", location: "Lab Room B", category: "educational", status: "published", capacity: 30, startDatetime: past(5), endDatetime: past(4), organizerId: "user-staff" },
  { id: "event-3", title: "Workshop: Intro to TypeScript", description: "Beginner-friendly TypeScript workshop.", location: "Room 101", category: "educational", status: "published", capacity: 20, startDatetime: past(2), endDatetime: past(1), organizerId: "user-staff" },
  { id: "event-4", title: "Game Night", description: "Board games and fun for the whole team.", location: "Common Room", category: "social", status: "published", capacity: null, startDatetime: future(3), endDatetime: future(3), organizerId: "user-staff" },
  { id: "event-5", title: "Sprint Planning", description: "Sprint 2 planning session.", location: "Online", category: "educational", status: "draft", capacity: null, startDatetime: future(7), endDatetime: future(7), organizerId: "user-staff" },
];

beforeAll(async () => {
  await prisma.event.deleteMany();
  for (const e of SEED_EVENTS) {
    await prisma.event.upsert({ where: { id: e.id }, update: e, create: e });
  }
});

beforeEach(async () => {
  for (const e of SEED_EVENTS) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: { status: e.status },
      create: e,
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});