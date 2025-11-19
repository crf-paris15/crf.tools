import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  groupId: z.string().trim().min(1, "Le groupe est requis"),
  lockId: z.string().trim().min(1, "La serrure est requise"),
  file: z.file(),
});

async function securePOST(req: NextRequest, params: any, session: any) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    let group;

    try {
      group = await prisma.group.findFirstOrThrow({
        select: {
          id: true,
        },
        where: {
          id: Number(parsed.data.groupId),
        },
      });
    } catch {
      return APIResponse({ error: { message: "Le groupe n'existe pas" } }, 400);
    }

    const fileContent = (await parsed.data.file.text()).split("\r\n");
    const recordsUsers = [];
    const recordsAuthorizations = [];

    fileContent.forEach((line) => {
      const fields = line.split(",");

      recordsUsers.push({
        name: fields[0],
        email: fields[1],
        phoneNumber: fields[2],
        groupId: Number(group.id),
      });

      recordsAuthorizations.push({
        phoneNumber: fields[2],
        lockId: Number(parsed.data.lockId),
        startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdById: session.user.id,
      });
    });

    const users = await prisma.user.createMany({
      data: recordsUsers,
      skipDuplicates: true,
    });

    recordsAuthorizations.forEach((auth) => {
      prisma.user
        .findFirst({
          select: { id: true },
          where: {
            phoneNumber: auth.phoneNumber,
          },
        })
        .then(async (user) => {
          if (user) {
            await prisma.authorization.create({
              data: {
                userId: user.id,
                lockId: auth.lockId,
                startAt: auth.startAt,
                createdById: auth.createdById,
              },
            });
          }
        });
    });

    return APIResponse(
      { message: "Users and authorizations added successfully", users },
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
