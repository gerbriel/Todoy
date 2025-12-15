# Deploy the Email Edge Function to Supabase

## Prerequisites
- Supabase CLI installed: `brew install supabase/tap/supabase`
- Logged in: `supabase login`

## Steps to Deploy

### 1. Link your project
```bash
cd "/Users/gabrielrios/Desktop/Project Management"
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase Dashboard → Settings → General → Reference ID

### 2. Deploy the function
```bash
supabase functions deploy send-invite-email
```

### 3. Set the RESEND_API_KEY secret
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### 4. Test the function (optional)
```bash
supabase functions invoke send-invite-email --body '{
  "recipientEmail": "test@example.com",
  "inviterName": "Test User",
  "orgName": "Test Org",
  "inviteLink": "https://example.com/invite/123"
}'
```

## Update the email sender

In `supabase/functions/send-invite-email/index.ts`, line 72, change:
```typescript
from: 'Todoy <onboarding@resend.dev>',
```

To your verified Resend domain:
```typescript
from: 'Todoy <invites@yourdomain.com>',
```

Then redeploy:
```bash
supabase functions deploy send-invite-email
```

## Verify it's working

1. Go to your app
2. Send an invite
3. Check the recipient's email
4. Check Supabase Dashboard → Edge Functions → Logs to see if it ran successfully

## Troubleshooting

- **403 Forbidden**: Make sure you're logged in and linked to the right project
- **Email not sending**: Check Resend dashboard for delivery logs
- **Function not found**: Run `supabase functions list` to verify deployment
- **RESEND_API_KEY not set**: Run `supabase secrets list` to verify
