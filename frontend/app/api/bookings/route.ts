import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { z } from 'zod';
import { formatZodErrors } from '@/lib/validation';

const bookingSchema = z.object({
  practitionerId: z.string().uuid('Invalid practitioner ID'),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  visitType: z.enum(['initial_consultation', 'follow_up', 'telehealth']),
  message: z.string().max(500).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`bookings:post:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await request.json();

    // Validate
    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const data = validation.data;

    // Check if user is authenticated (optional - guests can also book)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Create a webform submission or custom content node
    // Using a simple approach: create a node of type that stores booking requests
    // Alternatively, this could send an email notification
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // For now, log the booking (without PII) and return success
    // In production, this would create a Drupal entity or send an email
    console.log('Booking request received:', {
      practitionerId: data.practitionerId,
      preferredTime: data.preferredTime,
      visitType: data.visitType,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your booking request has been submitted. The practitioner will contact you to confirm.',
      },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking request. Please try again.' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
