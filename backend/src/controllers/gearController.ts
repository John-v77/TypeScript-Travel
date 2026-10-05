import { GearModel } from "../models/gearModel";
import factory from "../utils/handlerFactory";


export const getAllGear = factory.getAll(GearModel);
export const getGear = factory.getOne(GearModel);

// Admin-only
export const createGear = factory.createOne(GearModel);
export const updateGear = factory.updateOne(GearModel);
export const deleteGear = factory.deleteOne(GearModel);

export default {
  getAllGear,
  getGear,
  createGear,
  updateGear,
  deleteGear,
};
