import dotenv from "dotenv";
import { createServer } from "./server";
import { database } from "./database";
import { Server } from "http";

dotenv.config({ path: "./.env" });

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await database.connect();
    // Create Express app
    const app = createServer();

    // Start server
    const port = process.env.PORT || 3000;
    const server: Server = app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (error: Error) => {
      console.log(error.name, error.message);
      console.log("Unhandled Rejection! -- Shutting down ...");
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(async () => {
        await database.disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
