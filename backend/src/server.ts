import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import path from "path";
import ExpressMongoSanitize from "express-mongo-sanitize";
import tourRouter from "./routes/tourRoutes";
import userRouter from "./routes/userRoutes";
import reviewRouter from "./routes/reviewRoutes";
import bookingRouter from "./routes/bookingRoutes";
import AppError from "./utils/appError";
import globalErrorHandler from "./utils/errorController";
import { globalLimiter } from "./middleware/rateLimiter";

export const createServer = () => {
  const app = express();

  // Global Middleware

  // Security HTTP headers (always apply for security)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Development loggin
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Apply global rate limiter to all API routes
  if (process.env.NODE_ENV !== "test") {
    app.use("/api", globalLimiter);
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Data sanitization (less aggressive in test environment)
  if (process.env.NODE_ENV !== "test") {
    // Data sanitization against NoSQL query injection
    app.use(ExpressMongoSanitize());

    // Data sanitization against XSS
  } else {
    // In test environment, apply minimal sanitization to allow test data
    app.use(
      ExpressMongoSanitize({
        replaceWith: "_",
        onSanitize: () => {}, // Silent sanitization for tests
      })
    );
  }

  app.use(
    hpp({
      whitelist: [
        "duration",
        "ratingsAverage",
        "ratingsQuantity",
        "maxGroupSize",
        "difficulty",
        "price",
      ],
    })
  );

  // Serve static files
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use(cors());

  app.use("/api/v1/tours", tourRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/reviews", reviewRouter);
  app.use("/api/v1/bookings", bookingRouter);

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.all("*", (req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  app.use(globalErrorHandler);

  return app;
};
