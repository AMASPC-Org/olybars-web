import { HolidayDiscoveryService } from "../server/src/services/HolidayDiscoveryService.js";

async function run() {
  const year = 2026;
  try {
    const count = await HolidayDiscoveryService.ingestHolidays(year);
    console.log(`🚀 Success: ${count} items added to Discovery Queue.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
}

run();
