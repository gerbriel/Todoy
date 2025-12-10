# Signup Flow with Organization Options

## Overview

The signup flow has been enhanced to provide users with three distinct onboarding paths when creating an account. This ensures every user has an organization context from day one, following best practices from professional tools like Slack, Notion, and Asana.

## User Experience

### Multi-Step Signup Process

The signup process is divided into three clear steps:

**Step 1: Basic Information** (1/3)
- Full Name
- Email
- Password

**Step 2: Organization Choice** (2/3)
Users choose from three options:

1. **Create an Organization**
   - Icon: Buildings (duotone)
   - Description: "Set up a new workspace and invite your team"
   - Use case: Starting a new team or company workspace

2. **Join an Organization**
   - Icon: Users (duotone)
   - Description: "Join an existing team with an invite code"
   - Use case: Joining an existing team via invitation

3. **Personal Workspace**
   - Icon: User (duotone)
   - Description: "Work solo in your own private workspace"
   - Use case: Individual users who want their own workspace

**Step 3: Organization Setup** (3/3)
Conditional based on choice:

- **Create**: Collect organization name and optional description
- **Join**: Enter invite code with helper text
- **Solo**: Name the personal workspace

### UI Features

- Progress indicator showing "(Step/3)" in the title
- Back button available on steps 2 and 3
- Context-aware button labels:
  - Step 1-2: "Continue"
  - Step 3: "Create Account"
- Clear visual selection using radio buttons and colored borders
- Smooth step transitions without page reloads

## Technical Implementation

### Component: LoginView.tsx

**State Management:**
```typescript
type OrgOption = 'create' | 'join' | 'solo'
type SignupStep = 1 | 2 | 3

const [signupStep, setSignupStep] = useState<SignupStep>(1)
const [orgOption, setOrgOption] = useState<OrgOption>('create')
const [orgName, setOrgName] = useState('')
const [orgDescription, setOrgDescription] = useState('')
const [workspaceName, setWorkspaceName] = useState('')
const [inviteCode, setInviteCode] = useState('')
```

**Step Validation:**
- Step 1: Validates name, email, password before advancing
- Step 2: Automatically advances to step 3 when submitted
- Step 3: Validates org-specific fields based on selected option
  - Create: Requires orgName
  - Join: Requires inviteCode
  - Solo: Requires workspaceName

**Navigation:**
```typescript
const handleBack = () => {
  if (signupStep === 3) setSignupStep(2)
  else if (signupStep === 2) setSignupStep(1)
  setError('')
}

const resetSignup = () => {
  setIsSignup(!isSignup)
  setSignupStep(1)
  setOrgOption('create')
  // Reset all form fields...
}
```

### Context: AuthContext.tsx

**Enhanced Signup Method:**
```typescript
interface OrganizationData {
  option: 'create' | 'join' | 'solo'
  orgName?: string
  orgDescription?: string
  workspaceName?: string
  inviteCode?: string
}

signup: (
  email: string, 
  password: string, 
  name: string, 
  organizationData: OrganizationData
) => Promise<void>
```

**Organization Creation Logic:**

1. **Create Organization** (`option: 'create'`)
   ```typescript
   const orgId = `org-${Date.now()}`
   const newOrg = {
     id: orgId,
     name: organizationData.orgName || 'My Organization',
     description: organizationData.orgDescription || '',
     createdAt: new Date().toISOString(),
     ownerId: newUser.id,
   }
   
   const newMember = {
     id: `member-${Date.now()}`,
     userId: newUser.id,
     orgId: orgId,
     role: 'owner',
     joinedAt: new Date().toISOString(),
   }
   ```

2. **Personal Workspace** (`option: 'solo'`)
   ```typescript
   const orgId = `org-solo-${newUser.id}`
   const newOrg = {
     id: orgId,
     name: organizationData.workspaceName || `${name}'s Workspace`,
     description: 'Personal workspace',
     createdAt: new Date().toISOString(),
     ownerId: newUser.id,
   }
   
   // User is assigned 'owner' role
   ```
   
   **Key Point**: Solo workspaces are NOT treated as a special case—they create a full Organization record with the user as owner.

3. **Join Organization** (`option: 'join'`)
   ```typescript
   // TODO: Implement full join logic
   // Current placeholder creates temporary org
   // Production implementation should:
   // - Validate invite code against orgInvites
   // - Lookup existing organization
   // - Add user with appropriate role
   // - Update orgMembers array
   ```

**State Updates:**
After creating the organization and member records:
1. Update React state (user, organization, orgMembers, users)
2. Persist to localStorage:
   - `todoy_user`: User object
   - `todoy_org`: Organization object
   - `todoy_org_members`: Array of OrgMember records
   - `todoy_users`: Array of all users

## Data Flow

```
LoginView (Signup Form)
  ↓ (Submit Step 3)
AuthContext.signup()
  ↓
Create User record
  ↓
Switch on organizationData.option
  ↓ ↓ ↓
  Create Org → Solo Workspace → Join Org (TODO)
  ↓           ↓                 ↓
Update State & localStorage
  ↓
User sees main app with organization context
```

## Solo Mode vs Organization Mode

**Important**: There is NO distinction between "solo mode" and "organization mode" in the application logic.

- Solo users get a personal Organization record
- Solo users are the owner of their organization
- All features work identically (projects, campaigns, tasks)
- Solo users can later invite members to their workspace
- Solo users can see the Organization view (though it will show only themselves)

**Why this approach?**
1. Simpler codebase - one code path for all users
2. Easy upgrade path - solo users can grow into teams
3. Consistent UX - all features available to everyone
4. Future-proof - organization features work from day one

## UI Components Used

- **Card, CardHeader, CardContent**: Main container
- **Label, Input**: Form fields
- **Button**: Primary actions and back navigation
- **Icons (Phosphor)**:
  - `Rocket`: App logo
  - `Buildings`: Create organization option
  - `Users`: Join organization option
  - `User`: Personal workspace option

## Error Handling

**Validation Errors:**
- Step 1: "Please enter your name/email/password"
- Step 3 Create: "Please enter an organization name"
- Step 3 Join: "Please enter an invite code"
- Step 3 Solo: "Please enter a workspace name"

**Authentication Errors:**
- Generic error message: "Authentication failed. Please try again."
- In production, should provide specific error details

## Future Enhancements

### 1. Join Organization Flow
- Validate invite codes against `orgInvites` records
- Lookup organization by code
- Check if invite is still valid (not expired, not used)
- Add user to org with correct role from invite
- Navigate to organization after successful join

### 2. Organization Browser
- Show list of public organizations
- Allow users to request to join
- Create `joinRequests` that admins can approve/deny
- Alternative to invite codes for public orgs

### 3. Email Verification
- Send verification email after signup
- Require email confirmation before full access
- Resend verification option

### 4. Social Signup
- "Continue with Google"
- "Continue with GitHub"
- OAuth integration

### 5. Organization Templates
- Pre-configured project structures
- Industry-specific templates (software, marketing, education)
- Quick start guides

## Testing Scenarios

### Manual Testing Checklist

**Create Organization Path:**
1. Click "Sign up"
2. Enter name, email, password → Click "Continue"
3. Select "Create an Organization" → Click "Continue"
4. Enter org name "Acme Inc" and description → Click "Create Account"
5. Verify: User logged in, organization created, user is owner
6. Check Organization view shows org details

**Personal Workspace Path:**
1. Sign up with basic info
2. Select "Personal Workspace"
3. Enter workspace name "John's Workspace"
4. Verify: Organization created with name, user is owner
5. Check that all features work normally

**Join Organization Path:**
1. Sign up with basic info
2. Select "Join an Organization"
3. Enter invite code
4. Verify: Placeholder org created (in production, should join real org)

**Navigation:**
- Back button works from steps 2 and 3
- "Already have an account?" resets to login form
- Errors display correctly for missing fields

**Edge Cases:**
- Empty org name defaults to "My Organization"
- Empty workspace name defaults to "{Name}'s Workspace"
- Switching between options on step 2 doesn't lose step 1 data
- Login form still works normally

## Related Documentation

- [ORGANIZATION_MANAGEMENT.md](./ORGANIZATION_MANAGEMENT.md) - Full org management features
- [Stage Filter Fix](./STAGE_FILTER_FIX.md) - Related filtering improvements
- [Move/Archive Dropdowns](./MOVE_ARCHIVE_DROPDOWN.md) - Organization-scoped actions

## Migration Notes

**For Existing Users:**
If implementing this in a system with existing users who don't have organizations:

1. Run migration script to create personal workspaces for all users
2. Generate org records with pattern `org-solo-{userId}`
3. Create OrgMember records with 'owner' role
4. Update user records to reference orgId
5. Test that all existing projects/campaigns/tasks still work

**Database Changes:**
- New localStorage keys used: `todoy_org`, `todoy_org_members`, `todoy_users`
- Organization type updated with `ownerId` field
- OrgMember role must be lowercase: 'owner', 'admin', 'member'

## Summary

This multi-step signup flow ensures every user has an organizational context from the moment they sign up, whether they're creating a team workspace, joining an existing one, or working solo. The implementation treats solo workspaces as first-class organizations, ensuring consistent behavior and easy scaling as users' needs grow.
