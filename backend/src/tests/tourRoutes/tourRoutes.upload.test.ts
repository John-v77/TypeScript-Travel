import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";
import sharp from "sharp";

jest.mock("../../models/tourModel");

// authController's real export is `export default {...}`, so overrides must
// be nested under `default` (with __esModule: true) or TS's esModuleInterop
// default-import helper reads the real (unmocked) functions instead of
// these jest.fn() ones.
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController")
    .default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "admin" };
        next();
      }),
      restrictTo: jest.fn((...roles: string[]) => {
        return (req: any, res: any, next: any) => {
          if (req.user && roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({
              status: "fail",
              message: "You do not have permission to perform this action",
            });
          }
        };
      }),
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

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
const mockSharp = sharp as unknown as jest.Mock;

describe("PATCH /api/v1/tours/:id - photo upload", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads and resizes the cover image and all gallery images, persisting filenames", async () => {
    const tourId = "123";

    mockTourModel.findByIdAndUpdate.mockImplementation((id, update: any) =>
      Promise.resolve({ _id: id, ...update }) as any,
    );

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .field("name", "Updated Tour")
      .attach("imageCover", Buffer.from("fake-cover-content"), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      })
      .attach("images", Buffer.from("fake-image-1"), {
        filename: "image1.jpg",
        contentType: "image/jpeg",
      })
      .attach("images", Buffer.from("fake-image-2"), {
        filename: "image2.jpg",
        contentType: "image/jpeg",
      })
      .expect(200);

    const coverPattern = new RegExp(`^tour-${tourId}-\\d+-cover\\.jpeg$`);
    const imagePattern = new RegExp(`^tour-${tourId}-\\d+-\\d\\.jpeg$`);

    // 1 cover + 2 gallery images = 3 sharp() calls
    expect(mockSharp).toHaveBeenCalledTimes(3);
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(2000, 1333);
    expect(mockSharpInstance.toFormat).toHaveBeenCalledWith("jpeg");
    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 90 });
    expect(mockSharpInstance.toFile).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^public/img/tours/tour-${tourId}-\\d+-cover\\.jpeg$`),
      ),
    );

    expect(mockTourModel.findByIdAndUpdate).toHaveBeenCalledWith(
      tourId,
      expect.objectContaining({
        name: "Updated Tour",
        imageCover: expect.stringMatching(coverPattern),
        images: expect.arrayContaining([expect.stringMatching(imagePattern)]),
      }),
      { new: true, runValidators: true },
    );

    expect(response.body.data.imageCover).toEqual(
      expect.stringMatching(coverPattern),
    );
    expect(response.body.data.images).toHaveLength(2);
  });

  it("rejects non-image uploads with 400 and never touches sharp or the database", async () => {
    const tourId = "123";

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .attach("imageCover", Buffer.from("just plain text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      })
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe(
      "Not an image! Please upload only images.",
    );
    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockTourModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("skips resizing when only the cover image is uploaded without gallery images", async () => {
    // resizeTourImages requires BOTH imageCover and images to be present
    // before it does anything with either of them.
    const tourId = "123";

    mockTourModel.findByIdAndUpdate.mockResolvedValue({
      _id: tourId,
      name: "Updated Tour",
    } as any);

    await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .field("name", "Updated Tour")
      .attach("imageCover", Buffer.from("fake-cover-content"), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      })
      .expect(200);

    expect(mockSharp).not.toHaveBeenCalled();
    expect(mockTourModel.findByIdAndUpdate).toHaveBeenCalledWith(
      tourId,
      { name: "Updated Tour" },
      { new: true, runValidators: true },
    );
  });

  it("skips resizing entirely when no files are uploaded", async () => {
    const tourId = "123";

    mockTourModel.findByIdAndUpdate.mockResolvedValue({
      _id: tourId,
      name: "Updated Tour",
    } as any);

    await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .send({ name: "Updated Tour" })
      .expect(200);

    expect(mockSharp).not.toHaveBeenCalled();
  });

  it("propagates a resize failure as a 500 error without updating the tour", async () => {
    const tourId = "123";

    mockSharpInstance.toFile.mockRejectedValueOnce(new Error("Disk full"));

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .attach("imageCover", Buffer.from("fake-cover-content"), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      })
      .attach("images", Buffer.from("fake-image-1"), {
        filename: "image1.jpg",
        contentType: "image/jpeg",
      })
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Disk full");
    expect(mockTourModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
