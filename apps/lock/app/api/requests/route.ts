import { APIResponse } from "@/app/utils/api/actions";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  console.log("Nuki webhook received");

  const rawBody = await req.text();
  console.log("Raw body: ", rawBody);

  const hmac = crypto
    .createHmac("sha256", process.env.NUKI_CLIENT_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  console.log("HMAC: ", hmac);

  const signature = req.headers.get("X-Nuki-Signature-SHA256");

  console.log("Signature: ", signature);

  if (signature !== hmac) {
    return APIResponse({ error: { message: "Invalid signature" } }, 401);
  }

  let parsed;

  try {
    parsed = JSON.parse(rawBody);
    console.log("Parsed body: ", parsed);
  } catch {
    console.log("Failed to parse body");
    return APIResponse({ error: { message: "Request body is invalid" } }, 422);
  }

  if (!parsed.smartlockId) {
    console.log("smartlockId is required");
    return APIResponse({ error: { message: "smartlockId is required" } }, 400);
  }

  let lock;

  try {
    lock = await prisma.lock.findFirstOrThrow({
      where: {
        nukiId: parsed.smartlockId.toString(),
      },
    });
    console.log("Found lock: ", lock);
  } catch {
    console.log("Lock not found");
    return APIResponse({ error: { message: "Lock cannot be found" } }, 400);
  }

  if (parsed.feature === "DEVICE_STATUS") {
    console.log("Processing DEVICE_STATUS feature");
    const reqFromLockCrfNotLongAgo = await prisma.request.count({
      where: {
        lockId: lock.id,
        createdAt: {
          gt: new Date(Date.now() - 10 * 1000), // 10 seconds ago
        },
      },
    });

    console.log(
      "Requests from lock.crf not long ago: ",
      reqFromLockCrfNotLongAgo,
    );

    if (reqFromLockCrfNotLongAgo === 0) {
      if (
        parsed.state?.state === 1 ||
        parsed.state?.state === 3 ||
        parsed.state?.state === 254
      ) {
        console.log("Creating log entry for state: ", parsed.state?.state);
        await prisma.log.create({
          data: {
            lock: { connect: { id: lock.id } },
            action:
              parsed.state?.state === 1
                ? 2
                : parsed.state?.state === 3
                  ? 1
                  : 254,
            source: "Nuki API",
          },
        });
      }

      console.log("Log added successfully");
      return APIResponse({ message: "Log added successfully" }, 200);
    } else {
      console.log("Request made by lock.crf recently, not adding log");
      return APIResponse(
        { message: "Log was not added since the request was made by lock.crf" },
        200,
      );
    }
  }

  if (parsed.requestId) {
    console.log("Processing request update for requestId: ", parsed.requestId);
    try {
      const request = await prisma.request.update({
        where: {
          id: parsed.requestId.toString(),
        },
        data: {
          success: parsed.success || false,
          error: parsed.errorCode || null,
        },
      });

      console.log("Request updated: ", request);

      if (request.logId) {
        console.log("Updating log for logId: ", request.logId);
        await prisma.log.update({
          where: {
            id: request.logId,
          },
          data: {
            success: parsed.success || false,
            details: parsed.errorCode || null,
          },
        });
      }

      console.log("Log updated successfully");

      return APIResponse({ message: "Request updated successfully" }, 200);
    } catch {
      console.log("Failed to update the request status");
      return APIResponse(
        { error: { message: "Failed to update the request status" } },
        500,
      );
    }
  }

  console.log("Unknown action received");
  return APIResponse({ message: "Unknown action" }, 400);
}
