# Cloudflare Turnstile CAPTCHA Setup Guide

This guide explains how to set up Cloudflare Turnstile for bot protection on the Verscienta Health platform.

## What is Cloudflare Turnstile?

Cloudflare Turnstile is a user-friendly CAPTCHA alternative that provides bot protection without requiring users to solve puzzles or click on images. It works invisibly in the background for most users.

**Benefits:**
- Privacy-first (no tracking cookies)
- Better user experience than traditional CAPTCHAs
- Free tier available
- Easy integration

## 1. Get Cloudflare Turnstile Credentials

### Sign Up for Cloudflare Turnstile:

1. Go to https://dash.cloudflare.com/
2. Log in or create a Cloudflare account
3. Navigate to **Turnstile** in the sidebar
4. Click **Add Site**

### Configure Your Site:

- **Site name:** Verscienta Health
- **Domains:**
  - `localhost` (for development)
  - `frontend.ddev.site` (for DDEV development)
  - Your production domain
- **Widget Mode:** Managed (recommended)

### Get Your Keys:

After creating the site, you'll receive:
- **Site Key** (public, used in frontend)
- **Secret Key** (private, used in backend verification)

## 2. Add Keys to Environment Variables

### Update `.env.local`:

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

**Important:**
- The `NEXT_PUBLIC_` prefix makes the site key available to the browser
- The secret key should NEVER be exposed to the client

## 3. Implementation Details

### Frontend Widget (`components/auth/TurnstileWidget.tsx`)

The Turnstile widget is implemented as a React component:

```tsx
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';

<TurnstileWidget
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setTurnstileToken(null)}
  onExpire={() => setTurnstileToken(null)}
/>
```

### Server-Side Verification (`lib/turnstile.ts`)

Tokens are verified on the server using:

```typescript
import { requireTurnstileVerification } from '@/lib/turnstile';

const verification = await requireTurnstileVerification(
  turnstileToken,
  clientIp
);

if (!verification.verified) {
  return { error: verification.error };
}
```

## 4. Current Implementation

Turnstile is currently integrated into:

### ✅ Registration Page (`/register`)
- Prevents automated bot registrations
- Validates token server-side before creating account

### Future Integration Points:

1. **Login Page** (`/login`)
   - Add rate limiting protection
   - Prevent brute force attacks

2. **Contact Forms**
   - Prevent spam submissions

3. **Symptom Checker** (`/symptom-checker`)
   - Prevent API abuse
   - Rate limit Grok AI requests

4. **Review Submissions**
   - Prevent fake reviews

## 5. Testing Turnstile

### Development Mode:

Cloudflare provides test keys for development:

**Always Passes:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Always Fails:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AB
```

**Forces Interactive Challenge:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=3x0000000000000000000000000000000FF
```

### Testing Steps:

1. Set test keys in `.env.local`
2. Restart Next.js dev server: `npm run dev`
3. Navigate to `/register`
4. The Turnstile widget should appear
5. Complete the widget (if interactive)
6. Submit the form
7. Check server logs for verification results

## 6. Error Handling

### Common Error Codes:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `missing-input-secret` | Secret key not provided | Check `TURNSTILE_SECRET_KEY` env var |
| `invalid-input-secret` | Secret key is invalid | Verify secret key in Cloudflare dashboard |
| `missing-input-response` | Token not provided | Ensure widget token is sent to backend |
| `invalid-input-response` | Token is invalid or expired | Token may have expired (tokens last 5 minutes) |
| `timeout-or-duplicate` | Token was already used | Generate a new token |

### Frontend Error Handling:

```tsx
<TurnstileWidget
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => {
    setTurnstileToken(null);
    setError('CAPTCHA verification failed. Please try again.');
  }}
  onExpire={() => {
    setTurnstileToken(null);
    // Optionally notify user to re-verify
  }}
/>
```

### Backend Error Handling:

```typescript
try {
  const verification = await requireTurnstileVerification(token, clientIp);

  if (!verification.verified) {
    return NextResponse.json(
      { error: verification.error },
      { status: 400 }
    );
  }

  // Proceed with request
} catch (error) {
  return NextResponse.json(
    { error: 'CAPTCHA verification error' },
    { status: 500 }
  );
}
```

## 7. Customization Options

### Widget Appearance:

```tsx
<Turnstile
  siteKey={siteKey}
  options={{
    theme: 'light', // or 'dark'
    size: 'normal', // 'normal', 'compact', or 'flexible'
    action: 'register', // Optional: track different actions
    cData: 'session_id', // Optional: custom data
  }}
/>
```

### Advanced Configuration:

For more control, you can:
1. Set different widget modes in Cloudflare dashboard
2. Configure appearance theme
3. Set custom error messages
4. Implement retry logic
5. Add analytics tracking

## 8. Best Practices

### Security:

✅ **DO:**
- Always verify tokens server-side
- Never trust client-side verification
- Use HTTPS in production
- Rotate secret keys periodically
- Monitor verification failures

❌ **DON'T:**
- Expose secret key to client
- Reuse tokens (they're single-use)
- Skip server-side verification
- Disable CAPTCHA on sensitive endpoints

### User Experience:

✅ **DO:**
- Show clear error messages
- Handle token expiration gracefully
- Allow users to retry
- Make widget visible and accessible

❌ **DON'T:**
- Hide the widget
- Block form submission without explanation
- Require CAPTCHA on every page

### Performance:

- Turnstile widget loads asynchronously
- Minimal performance impact (<100KB)
- Tokens expire after 5 minutes
- Failed verifications are logged

## 9. Monitoring & Analytics

### Cloudflare Dashboard:

View analytics at: https://dash.cloudflare.com/

Metrics include:
- Total verifications
- Success rate
- Challenge solve rate
- Top countries/IPs
- Error rates

### Application Logging:

Monitor in your logs:
```typescript
console.log('Turnstile verification:', {
  success: verification.verified,
  ip: clientIp,
  timestamp: new Date().toISOString(),
});
```

## 10. Production Deployment

### Pre-Deployment Checklist:

- [ ] Real Cloudflare Turnstile credentials configured
- [ ] Secret key stored securely (not in version control)
- [ ] Production domain added to Cloudflare Turnstile site
- [ ] HTTPS enabled
- [ ] Error handling tested
- [ ] Monitoring/logging configured

### Environment Variables:

Ensure these are set in your production environment:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-production-site-key>
TURNSTILE_SECRET_KEY=<your-production-secret-key>
```

### Deployment Steps:

1. Update Cloudflare Turnstile site to include production domain
2. Set production environment variables
3. Deploy application
4. Test registration with real CAPTCHA
5. Monitor verification success rates
6. Adjust widget mode if needed (invisible, managed, or forced)

## 11. Troubleshooting

### Widget Not Appearing:

1. Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
2. Restart Next.js dev server
3. Check browser console for errors
4. Verify domain is allowed in Cloudflare dashboard

### Verification Always Fails:

1. Confirm secret key is correct
2. Check token is being sent to backend
3. Verify server can reach Cloudflare API
4. Check for network/firewall issues

### Token Expired:

- Tokens expire after 5 minutes
- Regenerate widget on expiry
- Handle `onExpire` callback

## 12. Additional Resources

- Cloudflare Turnstile Docs: https://developers.cloudflare.com/turnstile/
- React Turnstile Package: https://github.com/marsidev/react-turnstile
- API Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

---

**Note:** Turnstile is currently only implemented on the registration page. For comprehensive bot protection, consider adding it to login, contact forms, and API-heavy pages.
