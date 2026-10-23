import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { notifications, studentProfiles, systemSettings, users, conversations, conversationParticipants, messages } from "@/db/schema";

/**
 * Development seeder. All data is fictional.
 * Run: npm run db:seed
 */
async function main() {
  console.log("Seeding Mindwell development data...");

  const passwordHash = await bcrypt.hash("Password123", 12);

  const seedUsers: {
    email: string;
    fullName: string;
    role: "student" | "counselor" | "admin";
    phone?: string;
  }[] = [
    { email: "admin@mindwell.test", fullName: "Alex Reyes", role: "admin", phone: "+63 917 000 0001" },
    { email: "counselor@mindwell.test", fullName: "Dr. Maria Santos", role: "counselor", phone: "+63 917 000 0002" },
    { email: "counselor2@mindwell.test", fullName: "Dr. Joel Lim", role: "counselor", phone: "+63 917 000 0003" },
    { email: "student@mindwell.test", fullName: "Juan Dela Cruz", role: "student", phone: "+63 917 000 0004" },
    { email: "student2@mindwell.test", fullName: "Maria Clara Gonzales", role: "student", phone: "+63 917 000 0005" },
    { email: "student3@mindwell.test", fullName: "Paolo Mendoza", role: "student", phone: "+63 917 000 0006" },
  ];

  const ids: Record<string, number> = {};
  for (const seedUser of seedUsers) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seedUser.email))
      .limit(1);
    if (existing.length) {
      ids[seedUser.email] = existing[0].id;
      continue;
    }
    const [row] = await db
      .insert(users)
      .values({ ...seedUser, passwordHash })
      .execute();
    const id = Number(row.insertId);
    ids[seedUser.email] = id;
    if (seedUser.role === "student") {
      await db
        .insert(studentProfiles)
        .values({
          userId: id,
          studentNumber: `2026-${String(id).padStart(5, "0")}`,
          program: "BS Information Technology",
          yearLevel: "2nd Year",
        })
        .execute();
    }
  }

  // Sample notifications for the student account.
  const studentId = ids["student@mindwell.test"];
  const existingNotifications = await db
    .select({ id: notifications.userId })
    .from(notifications)
    .where(eq(notifications.userId, studentId))
    .limit(1);
  if (!existingNotifications.length) {
    await db
      .insert(notifications)
      .values([
        {
          userId: studentId,
          type: "appointment.confirmed",
          title: "Appointment confirmed",
          body: "Your counseling appointment with Dr. Maria Santos has been confirmed.",
          link: "/student/appointments",
        },
        {
          userId: studentId,
          type: "system.announcement",
          title: "Midterm wellness week",
          body: "Free guided relaxation sessions are available this week at the wellness center.",
          link: "/student/resources",
        },
      ])
      .execute();
  }

  // Sample 1:1 message threads so the Messages screen has content in dev.
  const now = Date.now();
  const threads: Array<{
    student: string;
    counselor: string;
    messages: Array<{ from: "student" | "counselor"; body: string }>;
  }> = [
    {
      student: "student@mindwell.test",
      counselor: "counselor@mindwell.test",
      messages: [
        {
          from: "counselor",
          body: "Hi Juan — I saw your check-in this week. How are you feeling about the upcoming exams?",
        },
        {
          from: "student",
          body: "Hi Dr. Santos. A bit overwhelmed, but I've been trying the 25-minute focus blocks from the resources page.",
        },
        {
          from: "counselor",
          body: "That's a great start. Would you like to talk it through in a short session this week?",
        },
      ],
    },
    {
      student: "student2@mindwell.test",
      counselor: "counselor@mindwell.test",
      messages: [
        {
          from: "student",
          body: "Good morning, Dr. Santos. I'd like to follow up on the breathing exercise we discussed.",
        },
        {
          from: "counselor",
          body: "Of course. Try the 4-7-8 pattern twice a day and note how you feel afterwards.",
        },
        {
          from: "student",
          body: "Thank you — I'll bring my notes to our next session.",
        },
      ],
    },
  ];

  for (const thread of threads) {
    const studentId = ids[thread.student];
    const counselorId = ids[thread.counselor];
    const pairKey = `${Math.min(studentId, counselorId)}:${Math.max(studentId, counselorId)}`;

    const existingThread = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.pairKey, pairKey))
      .limit(1);
    if (existingThread.length) continue;

    const createdAt = thread.messages.map(
      (_, index) => new Date(now - (thread.messages.length - index) * 36 * 60 * 1000),
    );
    const lastAt = createdAt[createdAt.length - 1];
    const lastFrom = thread.messages[thread.messages.length - 1].from;

    const [created] = await db
      .insert(conversations)
      .values({ pairKey, lastMessageAt: lastAt })
      .execute();
    const conversationId = Number(created.insertId);

    await db
      .insert(conversationParticipants)
      .values([
        {
          conversationId,
          userId: studentId,
          lastReadAt: lastFrom === "student" ? lastAt : null,
        },
        {
          conversationId,
          userId: counselorId,
          lastReadAt: lastFrom === "counselor" ? lastAt : null,
        },
      ])
      .execute();

    await db
      .insert(messages)
      .values(
        thread.messages.map((message, index) => ({
          conversationId,
          senderUserId: message.from === "student" ? studentId : counselorId,
          body: message.body,
          createdAt: createdAt[index],
        })),
      )
      .execute();
  }

  // Default system settings.
  const defaultSettings: { key: string; value: unknown }[] = [
    { key: "appointments.min_notice_hours", value: 4 },
    { key: "appointments.cancellation_cutoff_hours", value: 12 },
    { key: "appointments.session_duration_minutes", value: 50 },
    { key: "checkins.weekly_reminder_enabled", value: true },
    { key: "privacy.retention_days", value: 365 },
  ];
  for (const setting of defaultSettings) {
    await db
      .insert(systemSettings)
      .values(setting)
      .onDuplicateKeyUpdate({ set: { value: setting.value } })
      .execute();
  }

  console.log("Seed complete.");
  console.log("Development accounts (password: Password123):");
  for (const seedUser of seedUsers) {
    console.log(`  ${seedUser.role.padEnd(9)} ${seedUser.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
