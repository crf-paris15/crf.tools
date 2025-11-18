import { APIResponse } from "@/app/utils/api/actions";
import { auth } from "@/auth";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  apiSecret: z.string().trim().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const formData = await req.formData();
  const requestId = (await params).id;

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    if (parsed.data.apiSecret !== process.env.API_SECRET) {
      const session = await auth();

      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const request = await prisma.request.findUniqueOrThrow({
        where: {
          id: requestId,
        },
      });

      return APIResponse({ request }, 200);
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
