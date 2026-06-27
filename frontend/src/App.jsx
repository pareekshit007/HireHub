import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login          from '@/pages/auth/LoginPage'
import Register       from '@/pages/auth/RegisterPage'
import OAuthSuccess   from '@/pages/auth/OAuthSuccess'
import VerifyOTP      from '@/pages/auth/VerifyOTPPage'
import ForgotPassword from '@/pages/auth/ForgotPasswordPage'
import ResetPassword  from '@/pages/auth/ResetPasswordPage'

const Soon = ({ label }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <p className="text-4xl mb-3">🚧</p>
      <p className="text-lg font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">Coming in next phase</p>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Public routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Soon label="Home Page — F3" />} />
        <Route path="/jobs" element={<Soon label="Jobs Listing — F3" />} />
        <Route path="/jobs/:id" element={<Soon label="Job Detail — F3" />} />
        <Route path="/notifications" element={
          <ProtectedRoute><Soon label="Notifications — F7" /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Soon label="Profile — F4/F5" /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Soon label="Settings — F7" /></ProtectedRoute>
        } />

        {/* Seeker */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['seeker']}><Soon label="Seeker Dashboard — F4" /></ProtectedRoute>
        } />
        <Route path="/dashboard/applications" element={
          <ProtectedRoute roles={['seeker']}><Soon label="My Applications — F4" /></ProtectedRoute>
        } />
        <Route path="/dashboard/saved" element={
          <ProtectedRoute roles={['seeker']}><Soon label="Saved Jobs — F4" /></ProtectedRoute>
        } />

        {/* Employer */}
        <Route path="/employer/jobs" element={
          <ProtectedRoute roles={['employer']}><Soon label="My Jobs — F5" /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/new" element={
          <ProtectedRoute roles={['employer']}><Soon label="Post Job — F5" /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:id/edit" element={
          <ProtectedRoute roles={['employer']}><Soon label="Edit Job — F5" /></ProtectedRoute>
        } />
        <Route path="/employer/applications" element={
          <ProtectedRoute roles={['employer']}><Soon label="Applications — F5" /></ProtectedRoute>
        } />
        <Route path="/employer/applications/:id" element={
          <ProtectedRoute roles={['employer']}><Soon label="Application Detail — F5" /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><Soon label="Admin Dashboard — F6" /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}><Soon label="User Management — F6" /></ProtectedRoute>
        } />
        <Route path="/admin/jobs" element={
          <ProtectedRoute roles={['admin']}><Soon label="Job Approval — F6" /></ProtectedRoute>
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

      {/* Auth routes — no layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route path="/verify-otp"      element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
     
    </Routes>
  )
}