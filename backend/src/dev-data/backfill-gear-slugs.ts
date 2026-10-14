// Loads backend/.env before the database module reads it.
import "dotenv/config";
import { database } from "../database";
import { GearModel } from "../models/gearModel";


const backfill = async () => {
  await database.connect();

  const missing = await GearModel.find({ slug: { $exists: false } });
  for (const gear of missing) {
    await gear.save();
    console.log(`${gear.name} -> ${String(gear.slug)}`);
  }
  console.log(`Backfilled ${String(missing.length)} gear item(s).`);

  await database.disconnect();
};

backfill().catch((error: unknown) => {
  console.error("Gear slug backfill failed:", error);
  process.exit(1);
});
