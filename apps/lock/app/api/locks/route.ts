import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  nukiId: z.string().trim().min(1, "Le Nuki ID est requis"),
  nukiApiKey: z.string().trim().optional(),
  phoneNumber: z.string().optional(),
});

async function securePOST(req: NextRequest) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    const lock = await prisma.lock.create({
      data: {
        name: parsed.data.name,
        nukiId: parsed.data.nukiId,
        nukiApiKey: parsed.data.nukiApiKey ? parsed.data.nukiApiKey : null,
        phoneNumber: parsed.data.phoneNumber ? parsed.data.phoneNumber : null,
      },
    });

    return APIResponse({ message: "Lock created successfully", lock }, 201);
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
