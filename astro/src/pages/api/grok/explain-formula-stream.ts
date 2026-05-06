/**
 * POST /api/grok/explain-formula-stream
 *
 * Streams an explain-formula response as plain text chunks (Transfer-Encoding: chunked).
 * The client just reads the response body as text incrementally — no SSE parsing needed
 * on the frontend, the SSE parsing happens here.
 */
import type { APIRoute } from "astro";
import { buildExplainFormulaPrompts, callGrokStream } from "@/lib/grok";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { explainFormulaSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:explain:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validation = explainFormulaSchema.safeParse(body);
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!import.meta.env.XAI_API_KEY) {
    return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { systemPrompt, userPrompt } = buildExplainFormulaPrompts(validation.data);

  let upstream: Response;
  try {
    upstream = await callGrokStream(systemPrompt, userPrompt);
  } catch (error) {
    console.error("Explain formula stream error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");
    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to generate explanation." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  // Parse upstream SSE → emit plain text deltas to the client.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // Split on blank lines (SSE event boundary)
          let idx;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            // Each event has zero or more `data: ...` lines
            for (const line of event.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data) continue;
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Skip malformed chunks rather than aborting the whole stream
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
    cancel() {
      upstream.body?.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      ...rlHeaders,
    },
  });
};
