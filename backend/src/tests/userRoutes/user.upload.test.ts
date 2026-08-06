import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import authController from "../../controllers/authController";
import sharp from "sharp";
import { authHeader } from "./testHelpers";

jest.mock("../../models/userModel");
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController");
  return {
    __esModule: true,
    default: {
      ...actual.default,
      protect: jest.fn((req: any, res: any, next: any) => next()),
      restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
    },
  };
});

const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  toFormat: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue(undefined),
};

jest.mock("sharp", () => jest.fn(() => mockSharpInstance));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;
const mockSharp = sharp as unknown as jest.Mock;

describe("PATCH /api/v1/users/updateMe - photo upload", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123" };
        next();
      }
    );
  });

  it("uploads, resizes to a 500x500 jpeg, and persists the filename on the user", async () => {
    mockUserModel.findByIdAndUpdate.mockImplementation(
      (id, update: any) => Promise.resolve({ _id: id, ...update }) as any
    );

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .field("name", "John Doe")
      .attach("photo", Buffer.from("fake-image-content"), {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      })
      .expect(200);

    const filenamePattern = /^user-user123-\d+\.jpeg$/;

    expect(mockSharp).toHaveBeenCalledTimes(1);
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(500, 500);
    expect(mockSharpInstance.toFormat).toHaveBeenCalledWith("jpeg");
    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 90 });
    expect(mockSharpInstance.toFile).toHaveBeenCalledWith(
      expect.stringMatching(/^public\/img\/users\/user-user123-\d+\.jpeg$/)
    );

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      expect.objectContaining({
        name: "John Doe",
        photo: expect.stringMatching(filenamePattern),
      }),
      { new: true, runValidators: true }
    );

    expect(response.body.data.user.photo).toEqual(
      expect.stringMatching(filenamePattern)
    );
  });

  it("rejects non-image uploads with 400 and never touches sharp or the database", async () => {
    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .attach("photo", Buffer.from("just plain text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      })
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe(
      "Not an image! Please upload only images."
    );
    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("skips resizing entirely when no photo is uploaded", async () => {
    mockUserModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      name: "Updated Name",
    });

    await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { name: "Updated Name" },
      { new: true, runValidators: true }
    );
  });

  it("propagates a resize failure as a 500 error without updating the user", async () => {
    mockSharpInstance.toFile.mockRejectedValueOnce(new Error("Disk full"));

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .attach("photo", Buffer.from("fake-image-content"), {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      })
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Disk full");
    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("requires authentication before accepting an upload", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        res.status(401).json({
          status: "fail",
          message: "You are not logged in! Please log in to get access.",
        });
      }
    );

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .attach("photo", Buffer.from("fake-image-content"), {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      })
      .expect(401);

    expect(response.body.message).toContain("You are not logged in");
    expect(mockSharp).not.toHaveBeenCalled();
  });

  it("rejects a multipart request with no boundary", async () => {
    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .set("Content-Type", "multipart/form-data")
      .send("not a valid multipart body");

    // Busboy throws on the missing boundary before multer's fileFilter
    // (and therefore the controller) ever runs; exact status/message text
    // isn't part of the API contract, so just assert it fails as an error.
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
