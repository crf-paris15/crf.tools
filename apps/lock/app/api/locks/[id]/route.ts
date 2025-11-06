import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  nukiId: z.string().trim().min(1, "Le Nuki ID est requis"),
  nukiApiKey: z.string().trim().optional(),
  name: z.string().trim().min(1, "La localisation est requise"),
  phoneNumber: z.string().trim().optional(),
});

async function securePUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const formData = await req.formData();
  const lockId = (await params).id;

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    await prisma.lock.update({
      where: {
        id: Number(lockId),
      },
      data: {
        name: parsed.data.name,
        nukiId: parsed.data.nukiId,
        nukiApiKey: parsed.data.nukiApiKey ? parsed.data.nukiApiKey : null,
        phoneNumber: parsed.data.phoneNumber ? parsed.data.phoneNumber : null,
      },
    });

    return APIResponse({ message: "Lock updated successfully" }, 201);
  } else {
    const error: ZodError = parsed.error;

    let errorMessage = "";

    error.issues.map((issue) => {
      errorMessage += issue.message + "\n";
    });

    return APIResponse({ error: { message: errorMessage } }, 400);
  }
}

async function secureDELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const lockId = (await params).id;

  try {
    await prisma.lock.delete({
      where: {
        id: Number(lockId),
      },
    });

    await prisma.log.deleteMany({
      where: {
        lockId: Number(lockId),
      },
    });

    await prisma.authorization.deleteMany({
      where: {
        lockId: Number(lockId),
      },
    });

    return APIResponse({ message: "Lock deleted successfully" }, 200);
  } catch {
    return APIResponse({ error: { message: "Lock cannot be found" } }, 400);
  }
}

export const PUT = withAuth(securePUT);
export const DELETE = withAuth(secureDELETE);
