import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.EMAIL_USER || !env.EMAIL_APP_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST || 'smtp.gmail.com',
    port: env.EMAIL_PORT || 587,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

export async function sendOtpEmail(to, otp) {
  const mailer = getTransporter();
  if (!mailer) {
    if (env.NODE_ENV === 'test') {
      return { mock: true, otp };
    }
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD.');
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #E4E7EC; border-radius: 12px;">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #1E4FD6; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Spendly</h1>
      </div>
      <h2 style="color: #101828; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Verify your email address</h2>
      <p style="color: #475467; font-size: 14px; line-height: 20px; margin: 0 0 24px 0;">
        Welcome to Spendly! Use the verification code below to verify your email and finish creating your account. This code is valid for 10 minutes.
      </p>
      <div style="background: #F6F7F9; border: 1px solid #E4E7EC; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1E4FD6; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #98A2B3; font-size: 12px; line-height: 18px; margin: 0;">
        If you did not try to create a Spendly account, you can safely ignore this email. Never share this code with anyone.
      </p>
    </div>
  `;

  return mailer.sendMail({
    from: `"Spendly" <${env.EMAIL_USER}>`,
    to,
    subject: `Verify your email for Spendly: ${otp}`,
    text: `Your Spendly registration verification code is: ${otp}. It expires in 10 minutes.`,
    html,
  });
}
