"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidateTag } from "next/cache";

const NUKI_API_BASE_URL = "https://api.nuki.io";
const NUKI_DEFAULT_API_KEY = process.env.NUKI_API_KEY || "";
const NUKI_TIMEOUT = 5000;

export const nukiApiCall = async (
  lockId,
  endpoint,
  method,
  apiKey = NUKI_DEFAULT_API_KEY,
  body = null,
) => {
  const url = `${NUKI_API_BASE_URL}/smartlock/${lockId}${endpoint ? `/${endpoint}` : ""}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: AbortSignal.timeout(NUKI_TIMEOUT),
      cache: endpoint === "action/advanced" ? "no-cache" : "force-cache",
      next:
        endpoint === "action/advanced"
          ? {}
          : { revalidate: 60, tags: [`nuki:${lockId}`] },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false, error: "Nuki API call returned an error" };
  } catch (error) {
    Sentry.captureException(error);
    return { success: false, error: "Nuki API call failed" };
  }
};

export const nukiInvalidateCache = async (lockId: number) => {
  revalidateTag(`nuki:${lockId}`, "max");
};
