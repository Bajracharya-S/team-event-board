"use strict";
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = dbUrl.replace("file:", "");
const resolvedPath = path.resolve(dbPath);
const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
const prisma = new PrismaClient({ adapter });

// May 2026 date helper (month is 0-indexed internally)
function may(day, hour = 10, minute = 0) {
  return new Date(2026, 4, day, hour, minute);
}

// Users are not a DB table — they live in session/auth. We define them here
// so their IDs are used consistently across events, RSVPs, saved events,
// and comments. Roles: "admin" | "staff" | "member"
const USERS = [
  { id: "user-alice",  displayName: "Alice Nguyen",   role: "admin"  },
  { id: "user-bob",    displayName: "Bob Patel",       role: "staff"  },
  { id: "user-carol",  displayName: "Carol Torres",    role: "member" },
  { id: "user-dave",   displayName: "Dave Kim",        role: "member" },
  { id: "user-eve",    displayName: "Eve Okonkwo",     role: "member" },
  { id: "user-frank",  displayName: "Frank Russo",     role: "staff"  },
  { id: "user-grace",  displayName: "Grace Lim",       role: "member" },
  { id: "user-henry",  displayName: "Henry Zhao",      role: "member" },
];

async function main() {
  // Clear all tables in FK-safe order (children before parents)
  await prisma.comment.deleteMany();
  await prisma.rsvp.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.event.deleteMany();

  console.log("Cleared all tables.");

  // ── Events ──────────────────────────────────────────────────────────────────
  // 13 published + 1 draft + 1 archived across May 2026.
  // May 5 has THREE published events to satisfy the same-day cluster requirement.
  await prisma.event.createMany({
    data: [
      // --- Past events (May 1–5, today is May 6) ---
      {
        id: "evt-01",
        title: "Farmers Market Opening Day",
        description:
          "Kick off the season at the Amherst Farmers Market. Local produce, artisan goods, and live folk music from Valley Strings.",
        location: "Amherst Town Common",
        category: "social",
        status: "published",
        capacity: null,
        startDatetime: may(1, 8),
        endDatetime: may(1, 13),
        organizerId: "user-alice",
      },
      {
        id: "evt-02",
        title: "Community Yoga in the Park",
        description:
          "All-levels outdoor yoga session led by certified instructors from Amherst Yoga Studio. Bring your own mat; water provided.",
        location: "Mill River Park, Northampton",
        category: "sports",
        status: "published",
        capacity: 40,
        startDatetime: may(3, 9),
        endDatetime: may(3, 10, 30),
        organizerId: "user-bob",
      },
      // ── Three events on May 5 (same-day cluster) ───────────────────────────
      {
        id: "evt-03",
        title: "Cinco de Mayo Street Festival",
        description:
          "Celebrate Cinco de Mayo with live folklórico dance performances, street food from a dozen local vendors, and a family-friendly craft zone.",
        location: "Main Street, Northampton",
        category: "social",
        status: "published",
        capacity: 500,
        startDatetime: may(5, 11),
        endDatetime: may(5, 20),
        organizerId: "user-alice",
      },
      {
        id: "evt-04",
        title: "Salsa & Merengue Dance Workshop",
        description:
          "Beginner-friendly Latin dance workshop with instructor Maria Santos. No partner needed — just show up ready to move.",
        location: "Pioneer Valley Arts Center, Studio B",
        category: "arts",
        status: "published",
        capacity: 30,
        startDatetime: may(5, 14),
        endDatetime: may(5, 16),
        organizerId: "user-frank",
      },
      {
        id: "evt-05",
        title: "Mariachi Night at The Iron Horse",
        description:
          "An evening of traditional mariachi featuring Mariachi Sol de Amherst. All ages welcome. No cover charge.",
        location: "The Iron Horse Music Hall, Northampton",
        category: "arts",
        status: "published",
        capacity: 150,
        startDatetime: may(5, 19),
        endDatetime: may(5, 22),
        organizerId: "user-bob",
      },
      // ── Future published events (May 8–30) ────────────────────────────────
      {
        id: "evt-06",
        title: "Panel: AI Ethics in Healthcare",
        description:
          "Panelists from UMass Medical School and local health-tech startups discuss algorithmic bias, patient privacy, and the future of AI-driven diagnostics.",
        location: "UMass Amherst, CS Building Room 142",
        category: "educational",
        status: "published",
        capacity: 80,
        startDatetime: may(8, 18),
        endDatetime: may(8, 20),
        organizerId: "user-alice",
      },
      {
        id: "evt-07",
        title: "Mill River Cleanup Day",
        description:
          "Join volunteers to restore the Mill River Greenway corridor. Gloves and bags provided. Wear sturdy, closed-toe shoes.",
        location: "Mill River Greenway Trailhead, Florence",
        category: "volunteer",
        status: "published",
        capacity: 60,
        startDatetime: may(10, 9),
        endDatetime: may(10, 12),
        organizerId: "user-frank",
      },
      {
        id: "evt-08",
        title: "Mother's Day Craft Fair & Brunch",
        description:
          "Celebrate Mom with a family brunch buffet and handcrafted gifts from 30+ local artisans. Kids' activity corner included.",
        location: "Amherst Community Center, Main Hall",
        category: "social",
        status: "published",
        capacity: 120,
        startDatetime: may(14, 10),
        endDatetime: may(14, 14),
        organizerId: "user-bob",
      },
      {
        id: "evt-09",
        title: "Photography Walk: Spring Blooms",
        description:
          "Guided outdoor photography walk focused on macro and landscape techniques. Suitable for any camera or smartphone. Led by local photographer James Ortega.",
        location: "Hadley Farm Museum Grounds",
        category: "educational",
        status: "published",
        capacity: 25,
        startDatetime: may(17, 10),
        endDatetime: may(17, 13),
        organizerId: "user-alice",
      },
      {
        id: "evt-10",
        title: "Startup Pitch Night",
        description:
          "Six early-stage founders from the Pioneer Valley pitch their companies to local investors, mentors, and the public. Networking reception to follow.",
        location: "Venture Works, 37 Main St, Amherst",
        category: "educational",
        status: "published",
        capacity: 100,
        startDatetime: may(20, 18, 30),
        endDatetime: may(20, 21),
        organizerId: "user-frank",
      },
      {
        id: "evt-11",
        title: "Intro to Urban Gardening",
        description:
          "Hands-on workshop covering container gardening, composting basics, and growing food in small spaces. Seed packets to take home.",
        location: "Amherst Community Garden Shed",
        category: "educational",
        status: "published",
        capacity: 20,
        startDatetime: may(23, 10),
        endDatetime: may(23, 12),
        organizerId: "user-alice",
      },
      {
        id: "evt-12",
        title: "Memorial Day Block Party",
        description:
          "Annual neighborhood BBQ, lawn games, and acoustic live sets honoring local veterans. Free and open to all.",
        location: "Butterfield Terrace, Amherst",
        category: "social",
        status: "published",
        capacity: null,
        startDatetime: may(25, 13),
        endDatetime: may(25, 19),
        organizerId: "user-bob",
      },
      {
        id: "evt-13",
        title: "Summer Kickoff Concert",
        description:
          "Outdoor indie rock and folk concert welcoming the summer season. Four bands, two food trucks, and a merch market. Rain or shine.",
        location: "Puffer's Pond Amphitheater, Amherst",
        category: "arts",
        status: "published",
        capacity: 300,
        startDatetime: may(30, 17),
        endDatetime: may(30, 22),
        organizerId: "user-frank",
      },
      // ── Non-published events ───────────────────────────────────────────────
      {
        id: "evt-14",
        title: "Community Budget Forum",
        description:
          "Draft agenda for the annual public review of the town's proposed budget. Feedback will be collected before submission to town council.",
        location: "Town Hall, Meeting Room A",
        category: "social",
        status: "draft",
        capacity: 50,
        startDatetime: may(28, 18),
        endDatetime: may(28, 20),
        organizerId: "user-alice",
      },
      {
        id: "evt-15",
        title: "Spring 5K Fun Run",
        description: "Cancelled due to a venue scheduling conflict. We hope to reschedule for the fall.",
        location: "Amherst Rail Trail",
        category: "sports",
        status: "archived",
        capacity: 150,
        startDatetime: may(12, 8),
        endDatetime: may(12, 10),
        organizerId: "user-bob",
      },
    ],
  });

  console.log("Seeded 15 events (13 published, 1 draft, 1 archived).");

  // ── RSVPs ────────────────────────────────────────────────────────────────────
  // Only published events can have RSVPs. Each entry is unique on (eventId, userId).
  await prisma.rsvp.createMany({
    data: [
      // Carol Torres
      { id: "rsvp-carol-01", eventId: "evt-01", userId: "user-carol", status: "attending" },
      { id: "rsvp-carol-03", eventId: "evt-03", userId: "user-carol", status: "attending" },
      { id: "rsvp-carol-06", eventId: "evt-06", userId: "user-carol", status: "attending" },
      { id: "rsvp-carol-09", eventId: "evt-09", userId: "user-carol", status: "attending" },
      { id: "rsvp-carol-07", eventId: "evt-07", userId: "user-carol", status: "declined" },

      // Dave Kim
      { id: "rsvp-dave-02",  eventId: "evt-02", userId: "user-dave",  status: "attending" },
      { id: "rsvp-dave-04",  eventId: "evt-04", userId: "user-dave",  status: "attending" },
      { id: "rsvp-dave-07",  eventId: "evt-07", userId: "user-dave",  status: "attending" },
      { id: "rsvp-dave-10",  eventId: "evt-10", userId: "user-dave",  status: "attending" },
      { id: "rsvp-dave-12",  eventId: "evt-12", userId: "user-dave",  status: "attending" },
      { id: "rsvp-dave-09",  eventId: "evt-09", userId: "user-dave",  status: "declined"  },

      // Eve Okonkwo
      { id: "rsvp-eve-01",   eventId: "evt-01", userId: "user-eve",   status: "attending" },
      { id: "rsvp-eve-05",   eventId: "evt-05", userId: "user-eve",   status: "attending" },
      { id: "rsvp-eve-08",   eventId: "evt-08", userId: "user-eve",   status: "attending" },
      { id: "rsvp-eve-13",   eventId: "evt-13", userId: "user-eve",   status: "attending" },

      // Grace Lim
      { id: "rsvp-grace-03", eventId: "evt-03", userId: "user-grace", status: "attending" },
      { id: "rsvp-grace-06", eventId: "evt-06", userId: "user-grace", status: "attending" },
      { id: "rsvp-grace-10", eventId: "evt-10", userId: "user-grace", status: "attending" },
      { id: "rsvp-grace-13", eventId: "evt-13", userId: "user-grace", status: "attending" },

      // Henry Zhao
      { id: "rsvp-henry-02", eventId: "evt-02", userId: "user-henry", status: "attending" },
      { id: "rsvp-henry-06", eventId: "evt-06", userId: "user-henry", status: "attending" },
      { id: "rsvp-henry-07", eventId: "evt-07", userId: "user-henry", status: "attending" },
      { id: "rsvp-henry-11", eventId: "evt-11", userId: "user-henry", status: "attending" },
      { id: "rsvp-henry-12", eventId: "evt-12", userId: "user-henry", status: "attending" },
    ],
  });

  console.log("Seeded 25 RSVPs.");

  // ── Saved Events ─────────────────────────────────────────────────────────────
  await prisma.savedEvent.createMany({
    data: [
      { userId: "user-carol", eventId: "evt-06" },
      { userId: "user-carol", eventId: "evt-12" },
      { userId: "user-carol", eventId: "evt-13" },
      { userId: "user-dave",  eventId: "evt-03" },
      { userId: "user-dave",  eventId: "evt-08" },
      { userId: "user-dave",  eventId: "evt-13" },
      { userId: "user-eve",   eventId: "evt-04" },
      { userId: "user-eve",   eventId: "evt-11" },
      { userId: "user-grace", eventId: "evt-01" },
      { userId: "user-grace", eventId: "evt-09" },
      { userId: "user-grace", eventId: "evt-10" },
      { userId: "user-henry", eventId: "evt-06" },
      { userId: "user-henry", eventId: "evt-12" },
    ],
  });

  console.log("Seeded 13 saved events.");

  // ── Comments ─────────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        id: "cmt-01",
        eventId: "evt-01",
        authorId: "user-carol",
        authorDisplayName: "Carol Torres",
        content: "So excited for opening day! Last year's honey vendor was incredible — hoping they're back.",
        createdAt: new Date(2026, 3, 28),
      },
      {
        id: "cmt-02",
        eventId: "evt-01",
        authorId: "user-grace",
        authorDisplayName: "Grace Lim",
        content: "Is the maple syrup stand returning this season?",
        createdAt: new Date(2026, 3, 30),
      },
      {
        id: "cmt-03",
        eventId: "evt-03",
        authorId: "user-eve",
        authorDisplayName: "Eve Okonkwo",
        content: "Bringing the whole family — my kids have been counting down since March!",
        createdAt: new Date(2026, 4, 1),
      },
      {
        id: "cmt-04",
        eventId: "evt-04",
        authorId: "user-dave",
        authorDisplayName: "Dave Kim",
        content: "Maria Santos is an amazing instructor — took her beginner class last fall and left feeling like a real dancer.",
        createdAt: new Date(2026, 4, 2),
      },
      {
        id: "cmt-05",
        eventId: "evt-05",
        authorId: "user-eve",
        authorDisplayName: "Eve Okonkwo",
        content: "Mariachi Sol performed at my cousin's wedding — they are absolutely incredible live.",
        createdAt: new Date(2026, 4, 2),
      },
      {
        id: "cmt-06",
        eventId: "evt-06",
        authorId: "user-carol",
        authorDisplayName: "Carol Torres",
        content: "Really looking forward to the segment on diagnostic imaging bias — it's a topic that deserves more public attention.",
        createdAt: new Date(2026, 4, 4),
      },
      {
        id: "cmt-07",
        eventId: "evt-06",
        authorId: "user-henry",
        authorDisplayName: "Henry Zhao",
        content: "Will slides or a recording be shared after the event?",
        createdAt: new Date(2026, 4, 5),
      },
      {
        id: "cmt-08",
        eventId: "evt-07",
        authorId: "user-dave",
        authorDisplayName: "Dave Kim",
        content: "Signed up! Is anyone organizing carpooling from the Amherst side?",
        createdAt: new Date(2026, 4, 5),
      },
      {
        id: "cmt-09",
        eventId: "evt-09",
        authorId: "user-carol",
        authorDisplayName: "Carol Torres",
        content: "Perfect timing — the cherry blossoms at Hadley Farm are usually at peak bloom in mid-May.",
        createdAt: new Date(2026, 4, 5),
      },
      {
        id: "cmt-10",
        eventId: "evt-10",
        authorId: "user-grace",
        authorDisplayName: "Grace Lim",
        content: "One of the pitching founders is a close friend of mine — cannot wait to cheer her on!",
        createdAt: new Date(2026, 4, 5),
      },
      {
        id: "cmt-11",
        eventId: "evt-13",
        authorId: "user-eve",
        authorDisplayName: "Eve Okonkwo",
        content: "Nothing beats live music at Puffer's Pond in the summer. Already got my tickets.",
        createdAt: new Date(2026, 4, 5),
      },
      {
        id: "cmt-12",
        eventId: "evt-12",
        authorId: "user-henry",
        authorDisplayName: "Henry Zhao",
        content: "Will there be a moment of silence for veterans this year? I'd love to bring my grandfather.",
        createdAt: new Date(2026, 4, 5),
      },
    ],
  });

  console.log("Seeded 12 comments.");
  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
