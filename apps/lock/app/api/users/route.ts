import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { createRandomString } from "@/app/utils/ts/strings";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  groupId: z.string().trim().min(1, "Le groupe est requis"),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().optional(),
});

async function securePOST(req: NextRequest) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    if (parsed.data.email === undefined) {
      parsed.data.email = createRandomString(12) + "@fake.mail";
    }

    let userNumberWithThisPhone = 0;

    if (parsed.data.phoneNumber !== undefined) {
      userNumberWithThisPhone = await prisma.user.count({
        where: {
          phoneNumber: parsed.data.phoneNumber,
        },
      });
    }

    if (userNumberWithThisPhone === 0) {
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          group: {
            connect: {
              id: Number(parsed.data.groupId),
            },
          },
          phoneNumber: parsed.data.phoneNumber ? parsed.data.phoneNumber : null,
        },
      });

      return APIResponse({ message: "User added successfully", user }, 201);
    } else {
      return APIResponse(
        {
          error: {
            message: "Un utilisateur avec ce numéro de téléphone existe déjà.",
          },
        },
        400,
      );
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
