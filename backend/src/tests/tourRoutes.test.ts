import request from "supertest";
import { createServer } from "../server";
import { response } from "express";

describe("Tour Routes", () => {
  const app = createServer();

  describe("GET /api/v1/tours", () => {
    it("should get all tours", async () => {
      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(response.body).toEqual({
        status: "success",
        message: "Get all tours - dummy implementation",
      });
    });
  });

  describe("POST /api/v1/tours", () => {
    it("should create a new tour", async () => {
      const tourData = {
        name: "Test Tour",
        price: 200,
        duration: 5,
      };

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body).toEqual({
        status: "success",
        message: "Create tour - dummy implementation",
      });
    });
  });

  describe("GET /api/v1/tours/:id", () => {
    it("should get a tour by ID", async () => {
      const tourId = "123";

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        message: `Get tour by ID: ${tourId} - dummy implementation`,
      });
    });
  });

  describe("GET /api/v1/tours/:id", () => {
    it("should update a tour package", async () => {
      const tourId = "123";
      const updateData = {
        name: "Updated Tour Name",
        price: 300,
      };

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        message: `Update tour package ID: ${tourId}- dummy implementation `,
      });
    });
  });

  describe("DELETE /api/v1/tours/:id", () => {
    it("should delete a tour package", async () => {
      const tourId = "123";

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .expect(204);

      expect(response.body).toEqual({
        status: "success",
        message: `Update tour package ID: ${tourId} - dummy implementation`,
      });
    });
  });
});
