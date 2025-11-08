import { APIResponse } from "@/app/utils/api/actions";
import { prisma } from "@repo/db";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  from: z.string().trim().min(1, "From is required"),
  to: z.string().trim().min(1, "To is required"),
  apiSecret: z.string().trim().min(1, "API Secret is required"),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    if (parsed.data.apiSecret !== process.env.API_SECRET) {
      return APIResponse({ error: { message: "Invalid API Secret" } }, 403);
    }

    return APIResponse({ message: "Ok" }, 200);
  } else {
    const error: ZodError = parsed.error;
    let errorMessage = "";

    error.issues.map((issue) => {
      errorMessage += issue.message + "\n";
    });

    return APIResponse({ error: { message: errorMessage } }, 400);
  }
}
