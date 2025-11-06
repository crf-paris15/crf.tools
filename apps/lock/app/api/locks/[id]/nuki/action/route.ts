import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { nukiApiCall } from "@/app/utils/api/nuki";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";

const schema = z.object({
  action: z.string().min(1, "Action is required"),
});

async function securePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    const lockId = (await params).id;

    try {
      const lock = await prisma.lock.findUniqueOrThrow({
        select: {
          nukiId: true,
          nukiApiKey: true,
        },
        where: {
          id: Number(lockId),
        },
      });

      if (
        Number(parsed.data.action) !== 1 &&
        Number(parsed.data.action) !== 2
      ) {
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
        { action: parsed.data.action },
      );

      if (nukiData.success) {
        if (nukiData.data.error === "") {
          try {
            const request = await prisma.request.create({
              data: {
                id: nukiData.data.requestId,
                lockId: Number(lockId),
                action: Number(parsed.data.action),
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
      }

      return APIResponse({ error: { message: "Error on Nuki API" } }, 502);
    } catch {
      return APIResponse({ error: { message: "Lock cannot be found" } }, 400);
    }
  } else {
    const error: ZodError = parsed.error;
    let errorMessage = "";

    error.issues.map((issue) => {
      errorMessage += issue.message + "\n";
    });

    return APIResponse({ error: { message: errorMessage } }, 400);
  }
}

export const POST = withAuth(securePOST);
