const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
const wrap = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background:#f5f5f5; margin:0; padding:0; }
    .card { max-width:560px; margin:40px auto; background:#fff;
            border-radius:12px; overflow:hidden;
            box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .header { background:#2563EB; padding:28px 36px; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:600; }
    .body { padding:32px 36px; color:#374151; line-height:1.7; }
    .otp  { display:block; font-size:36px; font-weight:700; letter-spacing:10px;
            color:#2563EB; text-align:center; padding:20px 0; }
    .badge { display:inline-block; padding:4px 14px; border-radius:20px;
             font-size:13px; font-weight:600; }
    .badge-pending     { background:#FEF3C7; color:#92400E; }
    .badge-reviewed    { background:#DBEAFE; color:#1E40AF; }
    .badge-shortlisted { background:#D1FAE5; color:#065F46; }
    .badge-rejected    { background:#FEE2E2; color:#991B1B; }
    .badge-hired       { background:#D1FAE5; color:#065F46; }
    .btn { display:inline-block; margin-top:16px; padding:12px 28px;
           background:#2563EB; color:#fff; border-radius:8px;
           text-decoration:none; font-weight:600; font-size:14px; }
    .footer { background:#F9FAFB; padding:16px 36px; font-size:12px;
              color:#9CA3AF; text-align:center; }
  </style>
</head>
<body><div class="card">${content}</div></body>
</html>`;

// ── Send helper ───────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

// ── 1. OTP verification email ─────────────────────────────────────────────────
const sendOTPEmail = async (to, name, otp) => {
  const html = wrap(`
    <div class="header"><h1>HireHub</h1></div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use this one-time code to verify your email address.
         The code expires in <strong>10 minutes</strong>.</p>
      <span class="otp">${otp}</span>
      <p style="font-size:13px;color:#6B7280;text-align:center">
        Never share this code with anyone.
      </p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} HireHub. All rights reserved.</div>
  `);
  await sendEmail({ to, subject: `${otp} — Your HireHub verification code`, html });
};

// ── 2. Application confirmation (to seeker) ───────────────────────────────────
const sendApplicationConfirmation = async (to, { seekerName, jobTitle, companyName }) => {
  const html = wrap(`
    <div class="header"><h1>Application submitted ✓</h1></div>
    <div class="body">
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> at
         <strong>${companyName}</strong> has been successfully submitted.</p>
      <p>The employer will review your profile and update the status. You can
         track all your applications from your dashboard.</p>
      <a href="${process.env.CLIENT_URL}/dashboard/applications" class="btn">
        View applications
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} HireHub.</div>
  `);
  await sendEmail({ to, subject: `Application submitted — ${jobTitle} at ${companyName}`, html });
};

// ── 3. New application alert (to employer) ────────────────────────────────────
const sendNewApplicationAlert = async (to, { employerName, applicantName, jobTitle, applicationId }) => {
  const html = wrap(`
    <div class="header"><h1>New application received</h1></div>
    <div class="body">
      <p>Hi <strong>${employerName}</strong>,</p>
      <p><strong>${applicantName}</strong> has applied for your job posting:
         <strong>${jobTitle}</strong>.</p>
      <a href="${process.env.CLIENT_URL}/employer/applications/${applicationId}" class="btn">
        Review application
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} HireHub.</div>
  `);
  await sendEmail({ to, subject: `New application for ${jobTitle}`, html });
};

// ── 4. Status update (to seeker) ─────────────────────────────────────────────
const sendStatusUpdateEmail = async (to, { seekerName, jobTitle, companyName, status, note }) => {
  const labels = {
    reviewed:    'Your application is under review',
    shortlisted: '🎉 You have been shortlisted!',
    rejected:    'Application update',
    hired:       '🎉 Congratulations — You are hired!',
  };
  const html = wrap(`
    <div class="header"><h1>${labels[status] || 'Application update'}</h1></div>
    <div class="body">
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>There is an update on your application for
         <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>New status: <span class="badge badge-${status}">${status.toUpperCase()}</span></p>
      ${note ? `<p><em>Message from employer:</em> ${note}</p>` : ''}
      <a href="${process.env.CLIENT_URL}/dashboard/applications" class="btn">
        View details
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} HireHub.</div>
  `);
  await sendEmail({ to, subject: `Application update — ${jobTitle}`, html });
};

// ── 5. Job approved / rejected (to employer) ──────────────────────────────────
const sendJobStatusEmail = async (to, { employerName, jobTitle, approved, reason }) => {
  const html = wrap(`
    <div class="header">
      <h1>${approved ? 'Job listing approved ✓' : 'Job listing update'}</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${employerName}</strong>,</p>
      ${approved
        ? `<p>Your job listing <strong>${jobTitle}</strong> has been approved and is now live on HireHub.</p>`
        : `<p>Your job listing <strong>${jobTitle}</strong> was not approved.</p>
           ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}`
      }
      <a href="${process.env.CLIENT_URL}/employer/jobs" class="btn">
        View my jobs
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} HireHub.</div>
  `);
  await sendEmail({
    to,
    subject: approved ? `Job approved — ${jobTitle}` : `Job listing update — ${jobTitle}`,
    html,
  });
};

module.exports = {
  sendOTPEmail,
  sendApplicationConfirmation,
  sendNewApplicationAlert,
  sendStatusUpdateEmail,
  sendJobStatusEmail,
};
