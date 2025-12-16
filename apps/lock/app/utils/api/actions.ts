"use server";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { nukiApiCall } from "./nuki";
import * as Sentry from "@sentry/nextjs";

export async function revalidate(path) {
  revalidatePath(path);
}

export async function APIResponse(data: any, status = 200) {
  if (status >= 400) {
    Sentry.captureMessage(
      `API Response Error: ${JSON.stringify(data)} with status ${status}`,
    );
  }

  return new NextResponse(
    JSON.stringify({
      success: status < 400,
      ...data,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export async function nukiAction(
  action,
  lockId,
  userId,
  authorizationId,
  source,
) {
  let lock;

  try {
    lock = await prisma.lock.findUniqueOrThrow({
      select: {
        nukiId: true,
        nukiApiKey: true,
      },
      where: {
        id: Number(lockId),
      },
    });
  } catch {
    return APIResponse({ error: { message: "Lock cannot be found" } }, 400);
  }

  if (Number(action) !== 1 && Number(action) !== 2) {
    return APIResponse(
      { error: { message: "Action must be 1 (unlock) or 2 (lock)" } },
      400,
    );
  }

  await prisma.request.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 1 * 60 * 1000) },
    },
  });

  const nukiData = await nukiApiCall(
    lock.nukiId,
    "action/advanced",
    "POST",
    lock.nukiApiKey || undefined,
    { action },
  );

  if (nukiData.success) {
    if (nukiData.data.error === undefined) {
      try {
        let log;

        if (authorizationId) {
          log = await prisma.log.create({
            data: {
              lock: { connect: { id: Number(lockId) } },
              user: { connect: { id: userId } },
              authorization: { connect: { id: Number(authorizationId) } },
              action,
              source,
            },
          });
        } else {
          log = await prisma.log.create({
            data: {
              lock: { connect: { id: Number(lockId) } },
              user: { connect: { id: userId } },
              action,
              source,
            },
          });
        }

        const request = await prisma.request.create({
          data: {
            id: nukiData.data.requestId,
            lock: { connect: { id: Number(lockId) } },
            user: { connect: { id: userId } },
            log: { connect: { id: log.id } },
            action: action,
          },
        });

        return APIResponse(
          { message: "Request created successfully", request },
          201,
        );
      } catch (error) {
        Sentry.captureException(error);
        return APIResponse(
          { error: { message: "Request creation failed" } },
          400,
        );
      }
    }

    return APIResponse(
      { error: { message: "Error from Nuki API: " + nukiData.data.error } },
      400,
    );
  } else {
    return APIResponse({ error: { message: "Error:" + nukiData.error } }, 500);
  }
}
