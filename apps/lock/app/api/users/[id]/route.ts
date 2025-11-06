import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { createRandomString } from "@/app/utils/ts/strings";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().trim().optional(),
  groupId: z.string().trim(),
});

async function securePUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const formData = await req.formData();
  const userId = (await params).id;

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    if (parsed.data.email === undefined) {
      parsed.data.email = createRandomString(12) + "@fake.mail";
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phoneNumber: parsed.data.phoneNumber ? parsed.data.phoneNumber : null,
        groupId: Number(parsed.data.groupId),
      },
    });

    return APIResponse({ message: "User updated successfully" }, 201);
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
  const userId = (await params).id;

  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return APIResponse({ message: "User deleted successfully" }, 200);
  } catch {
    return APIResponse({ error: { message: "User cannot be found" } }, 400);
  }
}

export const PUT = withAuth(securePUT);
export const DELETE = withAuth(secureDELETE);
