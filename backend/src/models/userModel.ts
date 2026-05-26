import { Schema, model, Document } from "mongoose";
import validator from "validator";

export interface User extends Document {
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
}

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: [true, "User name is required"],
  },

  email: {
    type: String,
    required: [true, "User email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "Please confirm a password"],
    validate: {
      validator: function (this: User, el: string): boolean {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
});

export const UserModel = model<User>("User", userSchema);
