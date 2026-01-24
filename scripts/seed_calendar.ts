import { db } from "../server/src/firebaseAdmin.js";
import calendarData from "../server/src/data/calendar_master.json" with { type: "json" };

async function seedCalendar() {
  console.log("🚀 Seeding System Calendar from Master List...");
  const calendarRef = db.collection("system_calendar");

  for (const event of calendarData) {
    const slug = event.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    await calendarRef.doc(slug).set(
      {
        ...event,
        id: slug,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    console.log(`✅ Seeded: ${event.name} (${slug})`);
  }

  console.log("✨ Calendar Seeding Complete!");
  process.exit(0);
}

seedCalendar().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
