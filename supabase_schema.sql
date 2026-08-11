-- Supabase Schema for Xyphx Intern Portal

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'intern')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  force_password_change BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Interns Table
CREATE TABLE interns (
  profile_id UUID REFERENCES profiles(id) PRIMARY KEY,
  department TEXT,
  role_title TEXT,
  start_date DATE,
  end_date DATE,
  mentor TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'completed')) DEFAULT 'active'
);

-- 3. Milestones Table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Submitted', 'Completed', 'Overdue')) DEFAULT 'Not Started',
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Progress Updates Table
CREATE TABLE progress_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  current_progress TEXT,
  blockers TEXT,
  next_steps TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Feedback Table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  update_id UUID REFERENCES progress_updates(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL if global
  title TEXT NOT NULL,
  type TEXT,
  file_url TEXT NOT NULL,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Certificates Table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_id TEXT UNIQUE NOT NULL,
  file_url TEXT,
  status TEXT CHECK (status IN ('Not Issued', 'Issued', 'Revoked')) DEFAULT 'Not Issued',
  issue_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Announcements Table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('normal', 'high', 'urgent')) DEFAULT 'normal',
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Configuration

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Interns can read their own, Admins can read all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());

-- Interns: Interns can read their own, Admins can read/update all.
CREATE POLICY "Interns can view own intern record" ON interns FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Admins can view all interns" ON interns FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert interns" ON interns FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update interns" ON interns FOR UPDATE USING (is_admin());

-- Tasks: Interns can view/update own tasks, Admins have full access.
CREATE POLICY "Interns can view own tasks" ON tasks FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Interns can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = intern_id) WITH CHECK (auth.uid() = intern_id);
CREATE POLICY "Admins full access tasks" ON tasks FOR ALL USING (is_admin());

-- Milestones: Interns can view own, Admins full access.
CREATE POLICY "Interns view own milestones" ON milestones FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Admins full access milestones" ON milestones FOR ALL USING (is_admin());

-- Progress Updates: Interns can read/insert own, Admins can read all.
CREATE POLICY "Interns view own updates" ON progress_updates FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Interns insert own updates" ON progress_updates FOR INSERT WITH CHECK (auth.uid() = intern_id);
CREATE POLICY "Admins view all updates" ON progress_updates FOR SELECT USING (is_admin());

-- Documents: Interns view own or global, Admins full access.
CREATE POLICY "Interns view assigned documents" ON documents FOR SELECT USING (auth.uid() = target_intern_id OR target_intern_id IS NULL);
CREATE POLICY "Admins full access documents" ON documents FOR ALL USING (is_admin());

-- Certificates: Interns view own, Admins full access.
CREATE POLICY "Interns view own certificates" ON certificates FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Admins full access certificates" ON certificates FOR ALL USING (is_admin());

-- Announcements: Everyone can read active announcements, Admins can manage.
CREATE POLICY "Everyone views announcements" ON announcements FOR SELECT USING (expiry_date IS NULL OR expiry_date > NOW());
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (is_admin());

-- Audit logs: Admins only.
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins insert audit logs" ON audit_logs FOR INSERT WITH CHECK (is_admin());
