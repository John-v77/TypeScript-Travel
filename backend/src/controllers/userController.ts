import { Request, Response } from "express";

export const getAllUsers = (req: Request, res: Response): void => {
  console.log("Getting all users");
  res.status(200).send("Get all users");
};

export const getUserById = (req: Request, res: Response): void => {
  console.log("Getting UserById");
  res.status(200).send("Get all users");
};

export const updateUser = (req: Request, res: Response): void => {
  console.log("updateUser");
  res.status(200).send("Get all users");
};

export const deleteUser = (req: Request, res: Response): void => {
  console.log("deleteUser");
  res.status(200).send("Get all users");
};
