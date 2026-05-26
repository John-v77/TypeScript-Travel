import { Request, Response } from "express";

export const signup = (req: Request, res: Response): void => {
  console.log(req.body);
  res.status(201).send("User signup");
};
