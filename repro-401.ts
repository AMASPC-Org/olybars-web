import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  requireVenueAccess,
  AuthenticatedRequest,
} from "./server/src/middleware/authMiddleware.js";

// Mocking some internal things to make it run without full firebase-admin for now
// or just try to run it with full firebase if emulators are up.

async function runTest() {
  console.log("🧪 Starting 401 Repro Test...");

  const mockReq = {
    headers: {},
    url: "/api/venues/hannahs/private",
    params: { id: "hannahs" },
  } as any;

  const mockRes = {
    status: (code: number) => ({
      json: (body: any) => {
        console.log(`❌ Response ${code}:`, body);
        return mockRes;
      },
    }),
  } as any;

  const mockNext = () => console.log("✅ next() called");

  console.log("\n1. Testing verifyToken with no header:");
  await verifyToken(mockReq, mockRes, mockNext);

  console.log("\n2. Testing requireVenueAccess with missing user:");
  const middleware = requireVenueAccess("manager");
  await middleware(mockReq, mockRes, mockNext);
}

runTest();
