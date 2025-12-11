import { useState } from 'react'
import { Organization, OrgMember, User, OrgInvite, Project, Campaign, Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { toast } from 'sonner'
import { 
  Users, 
  PencilSimple, 
  UserPlus, 
  Crown, 
  ShieldCheck, 
  User as UserIcon,
  Trash,
  EnvelopeSimple,
  Clock,
  CheckCircle,
  XCircle,
  Folder,
  Target,
  ListChecks
} from '@phosphor-icons/react'
import { organizationsService } from '@/services/organizations.service'
import { orgMembersService } from '@/services/orgMembers.service'
import { orgInvitesService } from '@/services/orgInvites.service'

interface OrganizationViewProps {
  organization: Organization | null
  members: OrgMember[]
  users: User[]
  invites: OrgInvite[]
  projects: Project[]
  campaigns: Campaign[]
  tasks: Task[]
  setOrganization: (org: Organization) => void
  setMembers: (updater: (members: OrgMember[]) => OrgMember[]) => void
  setInvites: (updater: (invites: OrgInvite[]) => OrgInvite[]) => void
  currentUserId: string
  onNavigateToProject: (projectId: string) => void
  onNavigateToCampaign: (campaignId: string) => void
}

export default function OrganizationView({
  organization,
  members,
  users,
  invites,
  projects,
  campaigns,
  tasks,
  setOrganization,
  setMembers,
  setInvites,
  currentUserId,
  onNavigateToProject,
  onNavigateToCampaign,
}: OrganizationViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Edit org state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'owner'>('member')

  if (!organization) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Users size={64} className="mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No Organization</h2>
          <p className="text-muted-foreground">
            You're not part of any organization yet.
          </p>
        </div>
      </div>
    )
  }

  const currentMember = members.find(m => m.userId === currentUserId)
  const isAdmin = currentMember?.role === 'admin' || currentMember?.role === 'owner'

  const handleEditOrg = () => {
    setEditName(organization.name)
    setEditDescription(organization.description || '')
    setEditDialogOpen(true)
  }

  const handleSaveOrg = async () => {
    if (!editName.trim()) {
      toast.error('Organization name cannot be empty')
      return
    }

    try {
      const updated = await organizationsService.update(organization.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      })
      setOrganization(updated)
      toast.success('Organization updated')
      setEditDialogOpen(false)
    } catch (error) {
      toast.error('Failed to update organization')
      console.error(error)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email cannot be empty')
      return
    }

    try {
      const newInvite = await orgInvitesService.create({
        orgId: organization.id,
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedBy: currentUserId,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })

      setInvites(prev => [...prev, newInvite])
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('member')
      setInviteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to send invite')
      console.error(error)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await orgInvitesService.cancel(inviteId)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      toast.success('Invite cancelled')
    } catch (error) {
      toast.error('Failed to cancel invite')
      console.error(error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (confirm(`Remove ${users.find(u => u.id === member.userId)?.name || 'this member'} from the organization?`)) {
      try {
        await orgMembersService.remove(memberId)
        setMembers(prev => prev.filter(m => m.id !== memberId))
        toast.success('Member removed')
      } catch (error) {
        toast.error('Failed to remove member')
        console.error(error)
      }
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: 'member' | 'admin' | 'owner') => {
    try {
      await orgMembersService.updateRole(memberId, newRole)
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
      toast.success('Role updated')
    } catch (error) {
      toast.error('Failed to update role')
      console.error(error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} weight="fill" className="text-yellow-500" />
      case 'admin':
        return <ShieldCheck size={16} weight="fill" className="text-blue-500" />
      default:
        return <UserIcon size={16} className="text-muted-foreground" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'admin':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    }
  }

  // Filter org content
  const orgProjects = projects.filter(p => p.orgId === organization.id)
  const orgCampaigns = campaigns.filter(c => c.orgId === organization.id)
  const orgTasks = tasks.filter(t => {
    const taskCampaign = campaigns.find(c => c.id === t.campaignId)
    return taskCampaign?.orgId === organization.id
  })

  // Filter by selected member
  const filteredProjects = selectedMember === 'all' 
    ? orgProjects 
    : orgProjects.filter(p => p.assignedTo?.includes(selectedMember) || p.ownerId === selectedMember)
  
  const filteredCampaigns = selectedMember === 'all'
    ? orgCampaigns
    : orgCampaigns.filter(c => c.assignedTo?.includes(selectedMember) || c.createdBy === selectedMember)
  
  const filteredTasks = selectedMember === 'all'
    ? orgTasks
    : orgTasks.filter(t => t.assignedTo?.includes(selectedMember))

  const memberUsers = members.map(m => users.find(u => u.id === m.userId)).filter(Boolean) as User[]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Users size={32} weight="duotone" className="text-primary" />
              <h1 className="text-3xl font-bold">{organization.name}</h1>
            </div>
            {organization.description && (
              <p className="text-muted-foreground ml-11">{organization.description}</p>
            )}
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleEditOrg}>
              <PencilSimple size={16} className="mr-2" />
              Edit
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{orgProjects.length}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{orgCampaigns.length}</div>
            <div className="text-sm text-muted-foreground">Campaigns</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{orgTasks.length}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">
              Members
              <Badge variant="secondary" className="ml-2">{members.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invites">
              Invites
              <Badge variant="secondary" className="ml-2">{invites.filter(i => i.status === 'pending').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{organization.name}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="font-medium">{organization.description || 'No description'}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">{new Date(organization.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Activity tracking coming soon...
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-0 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Team Members</h3>
                {isAdmin && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {members.map(member => {
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon size={20} weight="duotone" className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {member.userName || 'Unknown User'}
                            {member.userId === currentUserId && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && member.userId !== currentUserId ? (
                          <Select
                            value={member.role}
                            onValueChange={(value: any) => handleUpdateMemberRole(member.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">
                                <div className="flex items-center gap-2">
                                  <UserIcon size={14} />
                                  Member
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck size={14} />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="owner">
                                <div className="flex items-center gap-2">
                                  <Crown size={14} />
                                  Owner
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleBadgeColor(member.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </div>
                          </Badge>
                        )}

                        {isAdmin && member.userId !== currentUserId && member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="invites" className="mt-0 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Pending Invitations</h3>
                {isAdmin && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <EnvelopeSimple size={16} className="mr-2" />
                    Send Invite
                  </Button>
                )}
              </div>

              {invites.filter(i => i.status === 'pending').length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <EnvelopeSimple size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites
                    .filter(i => i.status === 'pending')
                    .map(invite => {
                      const inviter = users.find(u => u.id === invite.invitedBy)

                      return (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <EnvelopeSimple size={24} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Invited by {inviter?.name || 'Unknown'} • {new Date(invite.invitedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getRoleBadgeColor(invite.role)}>
                              {invite.role}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock size={12} />
                              Pending
                            </Badge>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvite(invite.id)}
                              >
                                <XCircle size={16} className="text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {invites.filter(i => i.status !== 'pending').length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-4">Invite History</h3>
                  <div className="space-y-2">
                    {invites
                      .filter(i => i.status !== 'pending')
                      .map(invite => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <EnvelopeSimple size={24} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(invite.invitedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={
                              invite.status === 'accepted'
                                ? 'text-green-600 border-green-600'
                                : 'text-red-600 border-red-600'
                            }
                          >
                            {invite.status === 'accepted' ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : (
                              <XCircle size={12} className="mr-1" />
                            )}
                            {invite.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="content" className="mt-0 space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Organization Content</h3>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <Separator className="my-1" />
                    {memberUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Projects */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Folder size={18} weight="duotone" />
                  Projects ({filteredProjects.length})
                </h4>
                {filteredProjects.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No projects found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredProjects.map(project => (
                      <div 
                        key={project.id} 
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onNavigateToProject(project.id)}
                      >
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                        {project.assignedTo && project.assignedTo.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {project.assignedTo.map(userId => {
                              const user = users.find(u => u.id === userId)
                              return user ? (
                                <Badge key={userId} variant="outline" className="text-xs">
                                  {user.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Campaigns */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target size={18} weight="duotone" />
                  Campaigns ({filteredCampaigns.length})
                </h4>
                {filteredCampaigns.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No campaigns found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredCampaigns.map(campaign => (
                      <div 
                        key={campaign.id} 
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onNavigateToCampaign(campaign.id)}
                      >
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground">{campaign.description}</div>
                        {campaign.assignedTo && campaign.assignedTo.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {campaign.assignedTo.map(userId => {
                              const user = users.find(u => u.id === userId)
                              return user ? (
                                <Badge key={userId} variant="outline" className="text-xs">
                                  {user.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Tasks */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ListChecks size={18} weight="duotone" />
                  Tasks ({filteredTasks.length})
                </h4>
                {filteredTasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No tasks found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredTasks.map(task => {
                      const taskCampaign = campaigns.find(c => c.id === task.campaignId)
                      return (
                        <div key={task.id} className="p-3 border rounded-lg hover:bg-muted/50">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {taskCampaign?.title || 'Unknown campaign'}
                          </div>
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {task.assignedTo.map(userId => {
                                const user = users.find(u => u.id === userId)
                                return user ? (
                                  <Badge key={userId} variant="outline" className="text-xs">
                                    {user.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update your organization's details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter organization name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your organization..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrg}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: any) => setInviteRole(value)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <UserIcon size={14} />
                      <div>
                        <div className="font-medium">Member</div>
                        <div className="text-xs text-muted-foreground">Can view and edit assigned content</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">Can manage members and all content</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="flex items-center gap-2">
                      <Crown size={14} />
                      <div>
                        <div className="font-medium">Owner</div>
                        <div className="text-xs text-muted-foreground">Full control over organization</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite}>
              <EnvelopeSimple size={16} className="mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
