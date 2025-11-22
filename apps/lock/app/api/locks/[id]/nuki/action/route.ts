import { APIResponse, nukiAction } from "@/app/utils/api/actions";
import { withAuth } from "@/app/utils/api/auth";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

const schema = z.object({
  action: z.string().min(1, "Action is required"),
});

async function securePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any,
) {
  const formData = await req.formData();

  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return nukiAction(
      Number(parsed.data.action),
      (await params).id,
      session.user.id,
      null,
      1, // Admin panel
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
