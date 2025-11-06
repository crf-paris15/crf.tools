import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  lockId: z.string().trim().min(1, "L'ID de la serrure est requis"),
  userId: z.string().trim().min(1, "L'ID de l'utilisateur est requis"),
  startAt: z.string().trim().optional(),
  endAt: z.string().trim().optional(),
});

async function securePOST(req: NextRequest, params: any, session: any) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    const authorization = await prisma.authorization.create({
      data: {
        lock: {
          connect: {
            id: Number(parsed.data.lockId),
          },
        },
        user: {
          connect: {
            id: parsed.data.userId,
          },
        },
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      },
    });

    return APIResponse(
      { message: "Authorization created successfully", authorization },
      201,
    );
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
