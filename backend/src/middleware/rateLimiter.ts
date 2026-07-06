import { rateLimit } from "express-rate-limit";
import { Request, Response } from "express";

const LoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5,
  message: "Too many login attempts, please try again after an hour",
  handler: (req: Request, res: Response) => {
    res
      .status(429)
      .send("Too many login attempts, please try again after an hour");
  },
  // Use default keyGenerator to properly handle IPv6 addresses
  standardHeaders: false, // Disable the `RateLimit-*` headers
  legacyHeaders: true, // Enable the `X-RateLimit-*` headers
});

export default LoginLimiter;
