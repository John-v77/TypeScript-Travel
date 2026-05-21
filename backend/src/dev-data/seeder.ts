import fs from "fs";
import dotenv from "dotenv";

import { database } from "../database";
import { TourModel } from "../models/tourModel";
import { deleteTourPackage } from "../controllers/tourController";

dotenv.config({ path: "./config.env" });

interface TourJSONData {
  id: number;
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
}

const tours: TourJSONData[] = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours-simple.json`, "utf-8"),
);

const mapTourData = (tourData: TourJSONData) => ({
  name: tourData.name,
  duration: tourData.duration,
  maxGroupSize: tourData.maxGroupSize.toString(),
  difficulty: tourData.difficulty,
  ratingAverate: tourData.ratingsAverage,
  ratingQuantity: tourData.ratingsQuantity,
  price: tourData.price,
  priceDiscount: tourData.priceDiscount,
  summary: tourData.summary,
  description: tourData.description,
  imageCover: tourData.imageCover,
  images: tourData.images,
  startDates: tourData.startDates?.map((date) => new Date(date)),
});

const importData = async (): Promise<void> => {
  try {
    await database.connect();

    const mappedTours = tours.map(mapTourData);
    await TourModel.create(mappedTours);

    console.log("Data successfully loaded!");
  } catch (err) {
    console.log("Error importing data:", err);
  } finally {
    await database.disconnect();
    process.exit();
  }
};

const deleteData = async (): Promise<void> => {
  console.log("deleting");
  try {
    await database.connect();
    await TourModel.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log("Error deleting data:", err);
  } finally {
    await database.disconnect();
    process.exit();
  }
};

if (process.argv.includes("--import")) {
  importData();
} else if (process.argv.includes("--del")) {
  deleteData();
} else {
  console.log("Usage:");
  console.log("--import to import data");
  console.log("--del to delete all data");
}
