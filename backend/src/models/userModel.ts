import { Schema, model, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

export interface User extends Document {
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangeAt?: Date;
  active: boolean;
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
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
  passwordChangeAt: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

//Hash password before saving
userSchema.pre<User>("save", async function (next) {
  // Only run this fuction if password was actually modified
  if (!this.isModified("password")) {
    return next();
  }

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangeAt) {
    const changedTimeStamp = parseInt(
      (this.passwordChangeAt.getTime() / 1000).toString(),
      10,
    );
    return JWTTimestamp < changedTimeStamp;
  }

  // Returns false if password has not changed
  return false;
};

export const UserModel = model<User>("User", userSchema);
