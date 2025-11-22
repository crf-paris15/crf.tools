import { APIResponse, nukiAction } from "@/app/utils/api/actions";
import { validatePhoneNumberAccess } from "@/app/utils/api/phone";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  from: z.string().trim().min(1, "from is required"),
  to: z.string().trim().min(1, "to is required"),
  apiSecret: z.string().trim().min(1, "apiSecret is required"),
  action: z.string().trim().min(1, "action is required"),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    if (parsed.data.apiSecret !== process.env.API_SECRET) {
      return APIResponse({ error: { message: "Invalid API Secret" } }, 403);
    }

    const validation = await validatePhoneNumberAccess(
      parsed.data.from,
      parsed.data.to,
    );

    if (validation.success) {
      return nukiAction(
        Number(parsed.data.action),
        validation.lockId,
        validation.userId,
        validation.authorizationId,
        2, // Twilio
      );
    } else {
      return APIResponse(
        { error: { message: validation.error.message } },
        validation.status,
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
