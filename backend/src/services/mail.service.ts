import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailParams {
  recipient: string;
  subject: string;
  body: string;
}

export async function sendEmail({
  recipient,
  subject,
  body,
}: SendEmailParams) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipient,
    subject,
    text: body,
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log("Ethereal preview:", previewUrl);
  }

  return info;
}