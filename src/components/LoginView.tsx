import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Rocket, Users, User, Buildings } from '@phosphor-icons/react'

type OrgOption = 'create' | 'join' | 'solo'
type SignupStep = 1 | 2 | 3

export default function LoginView() {
  const { login, signup } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [signupStep, setSignupStep] = useState<SignupStep>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [orgOption, setOrgOption] = useState<OrgOption>('create')
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate current step
    if (isSignup && signupStep === 1) {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      if (!email.trim()) {
        setError('Please enter your email')
        return
      }
      if (!password.trim()) {
        setError('Please enter your password')
        return
      }
      // Move to step 2 - organization selection
      setSignupStep(2)
      return
    }

    if (isSignup && signupStep === 2) {
      // Move to step 3 - collect org-specific info
      setSignupStep(3)
      return
    }

    if (isSignup && signupStep === 3) {
      // Validate org-specific fields
      if (orgOption === 'create') {
        if (!orgName.trim()) {
          setError('Please enter an organization name')
          return
        }
      } else if (orgOption === 'join') {
        if (!inviteCode.trim()) {
          setError('Please enter an invite code')
          return
        }
      } else if (orgOption === 'solo') {
        if (!workspaceName.trim()) {
          setError('Please enter a workspace name')
          return
        }
      }
    }

    // Perform authentication
    setLoading(true)

    try {
      if (isSignup) {
        // Prepare organization data based on selected option
        const organizationData = {
          option: orgOption,
          orgName: orgOption === 'create' ? orgName : undefined,
          orgDescription: orgOption === 'create' ? orgDescription : undefined,
          workspaceName: orgOption === 'solo' ? workspaceName : undefined,
          inviteCode: orgOption === 'join' ? inviteCode : undefined,
        }
        
        await signup(email, password, name, organizationData)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      if (err.message === 'CONFIRM_EMAIL') {
        setShowEmailConfirmation(true)
        setError('')
      } else {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (signupStep === 3) {
      setSignupStep(2)
    } else if (signupStep === 2) {
      setSignupStep(1)
    }
    setError('')
  }

  const resetSignup = () => {
    setIsSignup(!isSignup)
    setSignupStep(1)
    setOrgOption('create')
    setOrgName('')
    setOrgDescription('')
    setWorkspaceName('')
    setInviteCode('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      {showEmailConfirmation ? (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket size={32} weight="duotone" className="text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Click the link in the email to confirm your account and get started.</p>
              <p className="mt-2">After confirming, you'll be redirected back to set up your workspace.</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setShowEmailConfirmation(false)
                setIsSignup(false)
                setSignupStep(1)
                setError('')
              }}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket size={32} weight="duotone" className="text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {isSignup 
                ? `Create Account ${signupStep > 1 ? `(${signupStep}/3)` : '(1/3)'}`
                : 'Welcome to Todoy'}
            </CardTitle>
            <CardDescription>
              {isSignup 
                ? signupStep === 1 
                  ? 'Enter your details to get started' 
                  : signupStep === 2
                  ? 'Choose how you want to work'
                  : 'Complete your workspace setup'
                : 'Sign in to continue to your workspace'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic Information */}
            {isSignup && signupStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Organization Choice */}
            {isSignup && signupStep === 2 && (
              <div className="space-y-3">
                <Label>How would you like to use Todoy?</Label>
                
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    orgOption === 'create' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setOrgOption('create')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Buildings size={24} weight="duotone" className={orgOption === 'create' ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Create an Organization</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Set up a new workspace and invite your team
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="orgOption" 
                      checked={orgOption === 'create'}
                      onChange={() => setOrgOption('create')}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    orgOption === 'join' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setOrgOption('join')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Users size={24} weight="duotone" className={orgOption === 'join' ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Join an Organization</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Join an existing team with an invite code
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="orgOption" 
                      checked={orgOption === 'join'}
                      onChange={() => setOrgOption('join')}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    orgOption === 'solo' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setOrgOption('solo')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <User size={24} weight="duotone" className={orgOption === 'solo' ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Personal Workspace</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Work solo in your own private workspace
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="orgOption" 
                      checked={orgOption === 'solo'}
                      onChange={() => setOrgOption('solo')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Organization-Specific Fields */}
            {isSignup && signupStep === 3 && (
              <>
                {orgOption === 'create' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        type="text"
                        placeholder="Acme Inc"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgDescription">Description (Optional)</Label>
                      <Input
                        id="orgDescription"
                        type="text"
                        placeholder="What does your organization do?"
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {orgOption === 'join' && (
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="Enter your invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask your team admin for an invite code
                    </p>
                  </div>
                )}

                {orgOption === 'solo' && (
                  <div className="space-y-2">
                    <Label htmlFor="workspaceName">Workspace Name</Label>
                    <Input
                      id="workspaceName"
                      type="text"
                      placeholder="My Workspace"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a name for your personal workspace
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Login Form (Non-Signup) */}
            {!isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {isSignup && signupStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}
              <Button 
                type="submit" 
                className={isSignup && signupStep > 1 ? "flex-1" : "w-full"} 
                disabled={loading}
              >
                {loading 
                  ? 'Please wait...' 
                  : isSignup 
                    ? signupStep === 3 
                      ? 'Create Account' 
                      : 'Continue'
                    : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={resetSignup}
              className="text-primary hover:underline"
            >
              {isSignup 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Demo Mode: Use any email and password to continue
            </p>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
