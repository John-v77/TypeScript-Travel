import jwt from "jsonwebtoken";
import request from "supertest";
import { User, UserModel } from "../models/userModel";
import { signToken } from "../controllers/authController";
import { Request, Response, NextFunction } from "express";
