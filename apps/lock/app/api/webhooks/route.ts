import { APIResponse } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  success: z.boolean(),
  errorCode: z.string().optional(),
});

async function securePOST(req: NextRequest) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    try {
      await prisma.request.update({
        data: {
          success: parsed.data.success,
          error: parsed.data.errorCode || null,
        },
        where: {
          id: parsed.data.requestId,
        },
      });

      return APIResponse({ message: "Request updated successfully" }, 200);
    } catch {
      return APIResponse(
        { error: { message: "Request cannot be found" } },
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
