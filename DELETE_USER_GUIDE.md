# Delete Test User via Supabase Dashboard

## Steps:

1. Go to: https://supabase.com/dashboard/project/llygmucahdxrzbzepkzg

2. Navigate to **Authentication** → **Users** (in the left sidebar)

3. Find the user with the email you want to delete

4. Click the three dots (...) next to the user

5. Select **Delete user**

6. Confirm the deletion

This will automatically:
- Delete the user from auth.users
- Cascade delete related profiles
- Remove org_members records (if foreign key cascade is set up)

## Alternative: Reset Password

If you just want to test the login flow without deleting:

1. In Authentication → Users
2. Click the user
3. Click "Send password recovery email"
4. Use the link to set a new password
5. You can then test the login

## Testing with New Invites

For testing the complete flow with fresh users, use temporary email services:
- https://temp-mail.org
- https://10minutemail.com
- https://guerrillamail.com

These give you disposable email addresses that you can check for invite emails.
