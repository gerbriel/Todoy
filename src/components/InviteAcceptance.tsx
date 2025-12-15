import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { orgInvitesService } from '../services/orgInvites.service'
import { orgMembersService } from '../services/orgMembers.service'
import { organizationsService } from '../services/organizations.service'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Users, CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { OrgInvite, Organization } from '../lib/types'

interface InviteAcceptanceProps {
  inviteId: string
  onAccepted: () => void
}

export default function InviteAcceptance({ inviteId, onAccepted }: InviteAcceptanceProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [invite, setInvite] = useState<OrgInvite | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadInvite()
  }, [inviteId])

  const loadInvite = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the invite
      const inviteData = await orgInvitesService.getById(inviteId)
      
      if (!inviteData) {
        setError('Invitation not found')
        setLoading(false)
        return
      }

      // Check if invite is still valid
      if (inviteData.status === 'accepted') {
        setError('This invitation has already been accepted')
        setLoading(false)
        return
      }

      if (inviteData.status === 'cancelled') {
        setError('This invitation has been cancelled')
        setLoading(false)
        return
      }

      // Check if expired
      if (new Date(inviteData.expiresAt) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      // Check if the invite email matches the logged in user
      if (user && user.email !== inviteData.email) {
        setError(`This invitation is for ${inviteData.email}. Please log in with that email address.`)
        setLoading(false)
        return
      }

      setInvite(inviteData)

      // Load organization details
      const orgData = await organizationsService.getById(inviteData.orgId)
      setOrganization(orgData)

      setLoading(false)
    } catch (err) {
      console.error('Error loading invite:', err)
      setError('Failed to load invitation')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invite || !user) return

    try {
      setProcessing(true)

      // Add user as organization member
      await orgMembersService.create({
        orgId: invite.orgId,
        userId: user.id,
        role: invite.role,
        joinedAt: new Date().toISOString(),
      })

      // Mark invite as accepted
      await orgInvitesService.accept(invite.id)

      setSuccess(true)
      toast.success(`Welcome to ${organization?.name}!`)
      
      // Redirect to main app after a short delay
      setTimeout(() => {
        onAccepted()
      }, 2000)
    } catch (err) {
      console.error('Error accepting invite:', err)
      toast.error('Failed to accept invitation')
      setProcessing(false)
    }
  }

  const handleDecline = () => {
    // Just redirect back to main app
    window.location.href = window.location.origin + '/Todoy/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <CircleNotch size={48} className="animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-destructive">
              <XCircle size={64} weight="fill" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDecline} className="w-full">
              Go to App
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-green-500">
              <CheckCircle size={64} weight="fill" />
            </div>
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              You've successfully joined {organization?.name}. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-primary">
            <Users size={64} weight="fill" />
          </div>
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{organization?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-semibold text-foreground capitalize">{invite?.role}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Invited by: <span className="font-semibold text-foreground">{invite?.invitedBy}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleAccept} 
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                <>
                  <CircleNotch size={16} className="animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
            <Button 
              onClick={handleDecline} 
              variant="outline" 
              className="w-full"
              disabled={processing}
            >
              Decline
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This invitation will expire on{' '}
            {invite && new Date(invite.expiresAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
