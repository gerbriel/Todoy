# Supabase Database Setup

## Instructions

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the ENTIRE SQL code below
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

---

## SQL Schema - Copy Everything Below This Line

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE public.org_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Organization Invites
CREATE TABLE public.org_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  visibility TEXT DEFAULT 'organization' CHECK (visibility IN ('private', 'organization', 'public'))
);

-- Project assigned users (many-to-many)
CREATE TABLE public.project_assignees (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  planning_start_date TIMESTAMPTZ,
  launch_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Stage Dates (for both campaigns and projects)
CREATE TABLE public.stage_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stage_name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  color TEXT,
  completed BOOLEAN DEFAULT FALSE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists (Kanban columns)
CREATE TABLE public.lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labels
CREATE TABLE public.labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  current_stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE
);

-- Task assigned users
CREATE TABLE public.task_assignees (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Task labels
CREATE TABLE public.task_labels (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Task stage dates
CREATE TABLE public.task_stage_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  color TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks
CREATE TABLE public.subtasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE public.attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage Templates
CREATE TABLE public.stage_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage Template Items
CREATE TABLE public.stage_template_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.stage_templates(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  color TEXT,
  duration_days INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_org_id ON public.projects(org_id);
CREATE INDEX idx_campaigns_project_id ON public.campaigns(project_id);
CREATE INDEX idx_campaigns_org_id ON public.campaigns(org_id);
CREATE INDEX idx_lists_campaign_id ON public.lists(campaign_id);
CREATE INDEX idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX idx_tasks_campaign_id ON public.tasks(campaign_id);
CREATE INDEX idx_stage_dates_campaign_id ON public.stage_dates(campaign_id);
CREATE INDEX idx_stage_dates_project_id ON public.stage_dates(project_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_stage_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_template_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organizations: Members can view, owners can update/delete
CREATE POLICY "Organization members can view"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can delete"
  ON public.organizations FOR DELETE
  USING (owner_id = auth.uid());

-- Org Members: Members can view, admins can manage
CREATE POLICY "Org members can view members"
  ON public.org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert members"
  ON public.org_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = org_members.org_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete members"
  ON public.org_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_members.org_id 
      AND om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin')
    )
  );

-- Projects: Org members can view and create, assigned users can update
CREATE POLICY "Org members can view projects"
  ON public.projects FOR SELECT
  USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_assignees
      WHERE project_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- Campaigns: Org members can view and create
CREATE POLICY "Org members can view campaigns"
  ON public.campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = campaigns.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = campaigns.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = campaigns.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = campaigns.org_id AND user_id = auth.uid()
    )
  );

-- Tasks: Org members can manage
CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = tasks.campaign_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = tasks.campaign_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = tasks.campaign_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = tasks.campaign_id AND om.user_id = auth.uid()
    )
  );

-- Lists: Org members can manage
CREATE POLICY "Org members can view lists"
  ON public.lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = lists.campaign_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can manage lists"
  ON public.lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.org_members om ON om.org_id = c.org_id
      WHERE c.id = lists.campaign_id AND om.user_id = auth.uid()
    )
  );

-- Labels: Org members can manage
CREATE POLICY "Org members can view labels"
  ON public.labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = labels.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can manage labels"
  ON public.labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = labels.org_id AND user_id = auth.uid()
    )
  );

-- Notifications: Users can view and update their own
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Allow all authenticated users to manage related tables
CREATE POLICY "Authenticated users can manage stage dates"
  ON public.stage_dates FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage subtasks"
  ON public.subtasks FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage comments"
  ON public.comments FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage attachments"
  ON public.attachments FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage task stage dates"
  ON public.task_stage_dates FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage stage templates"
  ON public.stage_templates FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage stage template items"
  ON public.stage_template_items FOR ALL
  USING (auth.uid() IS NOT NULL);

---

## ✅ Done!

If you see "Success. No rows returned", your database is ready!

### Next Steps:

1. **Update your .env file** with Supabase credentials
2. **Restart your dev server** to load the new environment variables
3. **Continue with the migration** - we'll update the code next!
