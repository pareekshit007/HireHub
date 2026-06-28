import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Auth
import Login          from '@/pages/auth/LoginPage'
import Register       from '@/pages/auth/RegisterPage'
import OAuthSuccess   from '@/pages/auth/OAuthSuccess'
// TODO: restore when email is configured
// import VerifyOTP      from '@/pages/auth/VerifyOTPPage'
// import ForgotPassword from '@/pages/auth/ForgotPasswordPage'
// import ResetPassword  from '@/pages/auth/ResetPasswordPage'

// Phase 1 — Public
import HomePage  from '@/pages/Homepage'
import JobsPage  from '@/pages/Jobspage'
import JobDetail from '@/pages/Jobdetailpage'

// Phase 2 — Seeker
import SeekerDashboard    from '@/pages/seeker/DashboardPage'
import NotificationsPage  from '@/pages/NotificationsPage'
import SettingsPage       from '@/pages/SettingsPage'
import SeekerProfile      from '@/pages/seeker/ProfilePage'
import SeekerApplications from '@/pages/seeker/ApplicationsPage'
import SavedJobsPage      from '@/pages/seeker/SavedJobsPage'

// Phase 3 — Employer
import EmployerDashboardPage    from '@/pages/employer/EmployerDashboardPage'
import MyJobsPage               from '@/pages/employer/MyJobsPage'
import PostJobPage              from '@/pages/employer/PostJobPage'
import EmployerApplicationsPage from '@/pages/employer/EmployerApplicationsPage'

// Phase 4 — Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage     from '@/pages/admin/AdminUsersPage'
import AdminJobsPage      from '@/pages/admin/AdminJobsPage'

const Soon = ({ label }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <p className="text-4xl mb-3">🚧</p>
      <p className="text-lg font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/"         element={<HomePage />} />
        <Route path="/jobs"     element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute roles={['seeker']}><SeekerProfile /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        {/* Seeker — Phase 2 */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['seeker']}><SeekerDashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/applications" element={
          <ProtectedRoute roles={['seeker']}><SeekerApplications /></ProtectedRoute>
        } />
        <Route path="/dashboard/saved" element={
          <ProtectedRoute roles={['seeker']}><SavedJobsPage /></ProtectedRoute>
        } />

        {/* Employer — Phase 3 */}
        <Route path="/employer/dashboard" element={
          <ProtectedRoute roles={['employer']}><EmployerDashboardPage /></ProtectedRoute>
        } />
        <Route path="/employer/jobs" element={
          <ProtectedRoute roles={['employer']}><MyJobsPage /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/new" element={
          <ProtectedRoute roles={['employer']}><PostJobPage /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:id/edit" element={
          <ProtectedRoute roles={['employer']}><PostJobPage /></ProtectedRoute>
        } />
        <Route path="/employer/applications" element={
          <ProtectedRoute roles={['employer']}><EmployerApplicationsPage /></ProtectedRoute>
        } />

        {/* Admin — Phase 4 */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/jobs" element={
          <ProtectedRoute roles={['admin']}><AdminJobsPage /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <p className="text-7xl font-black text-muted-foreground/20 mb-4">404</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
            <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
            <a href="/" className="text-primary hover:underline font-medium">Go home</a>
          </div>
        } />
      </Route>

      {/* Auth — no layout */}
      <Route path="/login"         element={<Login />} />
      <Route path="/register"      element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      {/* TODO: restore when email is configured
      <Route path="/verify-otp"      element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      */}
    </Routes>
  )
}