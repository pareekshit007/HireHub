import api from './axios'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  logout:    ()     => api.post('/auth/logout'),
  logoutAll: ()     => api.post('/auth/logout-all'),
  getMe:     ()     => api.get('/auth/me'),
  refresh:   ()     => api.post('/auth/refresh'),
  // TODO: restore when email is configured
  // verifyOTP:      (data) => api.post('/auth/verify-otp', data),
  // resendOTP:      (data) => api.post('/auth/resend-otp', data),
  // forgotPassword: (data) => api.post('/auth/forgot-password', data),
  // resetPassword:  (data) => api.post('/auth/reset-password', data),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:           ()     => api.get('/users/profile'),
  updateProfile:        (data) => api.put('/users/profile', data),
  updateSeekerProfile:  (data) => api.put('/users/seeker-profile', data),
  updateEmployerProfile:(data) => api.put('/users/employer-profile', data),
  uploadResume:         (form) => api.post('/users/upload-resume', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadLogo:           (form) => api.post('/users/upload-logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword:       (data) => api.put('/users/change-password', data),
  getPublicProfile:     (id)   => api.get(`/users/public/${id}`),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobAPI = {
  getJobs:       (params)     => api.get('/jobs', { params }),
  getJobById:    (id)         => api.get(`/jobs/${id}`),
  getCategories: ()           => api.get('/jobs/categories'),
  getRecommended:()           => api.get('/jobs/recommended'),
  getMyJobs:     (params)     => api.get('/jobs/employer/my-jobs', { params }),
  createJob:     (data)       => api.post('/jobs', data),
  updateJob:     (id, data)   => api.put(`/jobs/${id}`, data),
  deleteJob:     (id)         => api.delete(`/jobs/${id}`),
  closeJob:      (id)         => api.put(`/jobs/${id}/close`),
  approveJob:    (id)         => api.put(`/jobs/${id}/approve`),
  rejectJob:     (id, data)   => api.put(`/jobs/${id}/reject`, data),
}

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationAPI = {
  apply:                (jobId, form) => api.post(`/applications/${jobId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  withdraw:             (id)          => api.delete(`/applications/${id}/withdraw`),
  getMyApplications:    (params)      => api.get('/applications/my', { params }),
  getApplicationById:   (id)          => api.get(`/applications/${id}`),
  getApplicationsForJob:(jobId, params)=> api.get(`/applications/job/${jobId}`, { params }),
  getAllEmployerApps:    (params)      => api.get('/applications/employer/all', { params }),
  updateStatus:         (id, data)    => api.put(`/applications/${id}/status`, data),
}

// ── Saved Jobs ────────────────────────────────────────────────────────────────
export const savedJobAPI = {
  toggle: (jobId)  => api.post(`/saved-jobs/${jobId}`),
  getAll: (params) => api.get('/saved-jobs', { params }),
  check:  (jobId)  => api.get(`/saved-jobs/check/${jobId}`),
  remove: (jobId)  => api.delete(`/saved-jobs/${jobId}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:      (params) => api.get('/notifications', { params }),
  markRead:    (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/read-all'),
  delete:      (id)     => api.delete(`/notifications/${id}`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:     ()       => api.get('/admin/stats'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  getUserDetail:(id)     => api.get(`/admin/users/${id}`),
  toggleBan:    (id)     => api.put(`/admin/users/${id}/ban`),
  deleteUser:   (id)     => api.delete(`/admin/users/${id}`),
  getJobs:      (params) => api.get('/admin/jobs', { params }),
}