import { APIResponse } from "@/app/utils/api/actions";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const hmac = crypto
    .createHmac("sha256", process.env.NUKI_CLIENT_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  const signature = req.headers.get("X-Nuki-Signature-SHA256");

  if (signature !== hmac) {
    return APIResponse({ error: { message: "Invalid signature" } }, 401);
  }

  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return APIResponse({ error: { message: "Request body is invalid" } }, 422);
  }

  if (!parsed.smartlockLog?.smartlockId && !parsed.smartlockId) {
    return APIResponse({ error: { message: "Smartlook ID is required" } }, 400);
  }

  let lock;
  const smartlockId = parsed.smartlockLog?.smartlockId
    ? parsed.smartlockLog?.smartlockId
    : parsed.smartlockId;

  try {
    lock = await prisma.lock.findFirstOrThrow({
      where: {
        nukiId: smartlockId.toString(),
      },
    });
  } catch {
    return APIResponse({ error: { message: "Lock cannot be found" } }, 400);
  }

  if (parsed.feature === "DEVICE_LOGS") {
    const reqFromLockCrfNotLongAgo = await prisma.request.count({
      where: {
        lockId: lock.id,
        createdAt: {
          gt: new Date(Date.now() - 10 * 1000), // 10 seconds ago
        },
      },
    });

    if (reqFromLockCrfNotLongAgo === 0) {
      if (
        parsed.smartlockLog?.action === 2 ||
        parsed.smartlockLog?.action === 1
      ) {
        const user = await prisma.user.findUnique({
          select: { id: true },
          where: {
            nukiAccountId: parsed.smartlockLog?.authId,
          },
        });

        await prisma.log.create({
          data: {
            user: user ? { connect: { id: user.id } } : null,
            lock: { connect: { id: lock.id } },
            action: parsed.smartlockLog?.action,
            success: parsed.smartlockLog?.state <= 40,
            details: user ? null : parsed.smartlockLog?.name,
            source: 0, // Nuki API
          },
        });
      }

      return APIResponse({ message: "Log added successfully" }, 200);
    } else {
      return APIResponse(
        { message: "Log was not added since the request was made by lock.crf" },
        200,
      );
    }
  }

  if (parsed.requestId) {
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

      if (request.logId) {
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

      return APIResponse({ message: "Request updated successfully" }, 200);
    } catch {
      return APIResponse(
        { error: { message: "Failed to update the request status" } },
        500,
      );
    }
  }

  return APIResponse({ message: "Unknown action" }, 400);
}
