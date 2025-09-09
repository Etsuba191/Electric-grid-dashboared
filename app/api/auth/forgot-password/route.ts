import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true });
  }

  // Generate a reset token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  // Save token and expiry to user
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { resetToken: token, resetTokenExpiry: expires },
  });

  // Send email with reset link
  const transporter = nodemailer.createTransport({
    // TODO: Replace with your email service provider's configuration
    host: 'smtp.example.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'your-email@example.com', // TODO: Replace with your email
      pass: 'your-password', // TODO: Replace with your email password or app password
    },
  });

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"Electric Grid Dashboard" <no-reply@example.com>', // TODO: Replace with your sender address
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
             <p>Please click on the following link, or paste this into your browser to complete the process:</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Even if the email fails to send, we don't want to reveal to the user that the email address was valid.
    // In a real application, you would want to have more robust error handling and logging here.
  }

  return NextResponse.json({ ok: true });
}

