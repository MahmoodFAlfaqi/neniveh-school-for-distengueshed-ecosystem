import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("[EMAIL] Gmail credentials not configured");
    return false;
  }

  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/forgot-password?token=${resetToken}`;

  const mailOptions = {
    from: `"School Community" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request - School Community",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password for your School Community account.</p>
        <p>Your password reset token is:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <code style="font-size: 18px; font-weight: bold; color: #6366f1;">${resetToken}</code>
        </div>
        <p>Or click the button below to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p><strong>This token will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">This email was sent from School Community. Please do not reply to this email.</p>
      </div>
    `,
    text: `
Hello ${userName},

We received a request to reset your password for your School Community account.

Your password reset token is: ${resetToken}

Or visit this link to reset your password: ${resetUrl}

This token will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[EMAIL] Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send password reset email:", error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log("[EMAIL] Gmail credentials not configured - email functionality disabled");
    return false;
  }

  try {
    await transporter.verify();
    console.log("[EMAIL] Gmail connection verified successfully");
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to verify Gmail connection:", error);
    return false;
  }
}
