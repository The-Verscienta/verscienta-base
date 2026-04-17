/**
 * Cloudflare Turnstile Server-Side Verification
 *
 * Ported from frontend/lib/turnstile.ts — identical logic.
 * Only change: import.meta.env instead of process.env.
 */

export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileVerifyResponse> {
  const secretKey = import.meta.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Turnstile secret key not configured");
  }

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (remoteip) {
    formData.append("remoteip", remoteip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Turnstile verification failed: ${response.statusText}`);
  }

  return response.json();
}

export async function requireTurnstileVerification(
  token: string | null | undefined,
  clientIp?: string
): Promise<{ verified: true } | { verified: false; error: string }> {
  if (!token) {
    return { verified: false, error: "CAPTCHA verification is required" };
  }

  try {
    const result = await verifyTurnstileToken(token, clientIp);
    if (!result.success) {
      return { verified: false, error: "CAPTCHA verification failed. Please try again." };
    }
    return { verified: true };
  } catch {
    return { verified: false, error: "CAPTCHA verification error. Please try again." };
  }
}
