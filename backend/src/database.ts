import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

class Database implements DatabaseConnection {
  private connectionString: string;

  constructor() {
    const dbPassword = process.env.DATABASE_PASSWORD;
    const dbUrl = process.env.DATABASE_3;
    const localDB = process.env.DATABASE_LOCAL;

    if (process.argv.includes("--local")) {
      console.log("####### Local Database #######");
      if (!localDB) {
        throw new Error(
          "Local Database configuration missing. Check enviroment localdb variables"
        );
      }
      this.connectionString = localDB;
      console.log(this.connectionString);
    } else {
      if (!dbUrl || !dbPassword) {
        throw new Error(
          "Database configuration missing. Check DATABASE and DATABASE_PASSWORD environment variables."
        );
      }

      this.connectionString = dbUrl.replace("<db_password>", dbPassword);
    }
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.connectionString, {});

      console.log("DB connection successful!");
    } catch (err) {
      console.error("Database connection failed:", err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("DB disconnected successfully");
    } catch (error) {
      console.error("Database disconnection failed:", error);
      throw error;
    }
  }
}

export const database = new Database();
