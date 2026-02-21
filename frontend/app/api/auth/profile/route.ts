import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';

export async function PATCH(request: NextRequest) {
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
  const rateLimitResult = checkRateLimit(`auth:profile:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      field_first_name,
      field_last_name,
      mail,
      current_password,
      pass,
    } = body;

    // Get current user ID first
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_DRUPAL_BASE_URL}/jsonapi/user/user`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    const userId = userData.data[0]?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      data: {
        type: 'user--user',
        id: userId,
        attributes: {},
      },
    };

    if (field_first_name) updateData.data.attributes.field_first_name = field_first_name;
    if (field_last_name) updateData.data.attributes.field_last_name = field_last_name;
    if (mail) updateData.data.attributes.mail = mail;

    // Handle password change
    if (pass && current_password) {
      updateData.data.attributes.pass = {
        existing: current_password,
        value: pass,
      };
    }

    // Update user profile
    const updateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_DRUPAL_BASE_URL}/jsonapi/user/user/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      return NextResponse.json(
        { error: errorData.errors?.[0]?.detail || 'Failed to update profile' },
        { status: updateResponse.status }
      );
    }

    const updatedUser = await updateResponse.json();

    return NextResponse.json(
      {
        success: true,
        user: updatedUser.data,
      },
      { headers: rateLimitHeaders }
    );
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating profile' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
