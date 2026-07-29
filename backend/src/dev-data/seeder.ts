import fs from "fs";
import dotenv from "dotenv";
import { database } from "../database";
import { TourModel } from "../models/tourModel";
import { UserModel } from "../models/userModel";
import { ReviewModel } from "../models/reviewModel";

dotenv.config({ path: "./config.env" });

interface TourJSONData {
  _id: string;
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  startDates?: string[];
  guides?: string[];
  startLocation?: {
    type: string;
    coordinates: number[];
    address?: string;
    description?: string;
  };
}

interface UserJSONData {
  _id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  passwordConfirm?: string;
  photo?: string;
  active?: boolean;
}

interface ReviewJSONData {
  _id: string;
  review: string;
  rating: number;
  tour: string;
  user: string;
}

// Read JSON files
const tours: TourJSONData[] = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, "utf-8"),
);
const users: UserJSONData[] = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, "utf-8"),
);
const reviews: ReviewJSONData[] = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, "utf-8"),
);

const mapTourData = (tourData: TourJSONData) => ({
  name: tourData.name,
  duration: tourData.duration,
  maxGroupSize: tourData.maxGroupSize.toString(),
  difficulty: tourData.difficulty,
  ratingsAverage: tourData.ratingsAverage,
  ratingQuantity: tourData.ratingsQuantity,
  price: tourData.price,
  priceDiscount: tourData.priceDiscount,
  summary: tourData.summary,
  description: tourData.description,
  imageCover: tourData.imageCover,
  images: tourData.images,
  startDates: tourData.startDates?.map((date) => new Date(date)),
  guides: tourData.guides,
  startLocation: tourData.startLocation,
});

// Import data into DB
const importData = async (): Promise<void> => {
  try {
    await database.connect();

    // const mappedTours = tours.map(mapTourData);
    // await TourModel.create(mappedTours);
    // await UserModel.create(users, { validateBeforeSave: false });
    await ReviewModel.create(reviews);

    console.log("✅ Data successfully loaded!");
  } catch (err) {
    console.log("❌ Error importing data:", err);
  } finally {
    await database.disconnect();
    process.exit();
  }
};

// Delete all data from DB
const deleteData = async (): Promise<void> => {
  try {
    await database.connect();

    await TourModel.deleteMany();
    await ReviewModel.deleteMany();
    await UserModel.deleteMany();

    console.log("🗑️  Data successfully deleted!");
  } catch (err) {
    console.log("❌ Error deleting data:", err);
  } finally {
    await database.disconnect();
    process.exit();
  }
};

if (process.argv.includes("--import")) {
  console.log("📥 Importing data...");
  importData();
} else if (process.argv.includes("--del")) {
  console.log("🗑️  Deleting all data...");
  deleteData();
} else {
  console.log("📚 Data Seeder Usage:");
  console.log(
    "  npm run seed --import  - Import sample data (tours, users, reviews)",
  );
  console.log("  npm run seed --del     - Delete all data from database");
  console.log("");
  console.log("Examples:");
  console.log("  node dist/dev-data/seeder.js --import");
  console.log("  node dist/dev-data/seeder.js --del");
}
