import nodemailer from "nodemailer";


const getMailTransport = async () => {
  


  try {
   const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS:true,
  logger:true,
  debug:true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

    await transporter.verify();
    console.log("SMTP verified successfully");
    return transporter;
  } catch (error) {
  console.error("SMTP verification failed:");
  console.error(error);
  console.log("SMTP_USER =", process.env.SMTP_USER);
console.log("Has SMTP_PASSWORD =", !!process.env.SMTP_PASSWORD);
  return null;
}
};

export const sendVerificationEmail = async ({ to, code }) => {
  const transport = await getMailTransport();

  if (!transport) {
    throw new Error("Email service is not configured");
    console.log("SMTP_USER =", process.env.SMTP_USER);
console.log("Has SMTP_PASSWORD =", !!process.env.SMTP_PASSWORD);
  }

 

  const info = await transport.sendMail({
    from: '"Chatio" <a86543320@gmail.com>',
        to: to,
    subject: "Verify your Chatio email",
    text: `Your Chatio verification code is ${code}. It expires in 10 minutes.`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Chatio Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.08);
          "
        >
          <tr>
            <td
              align="center"
              style="
                background:#00a884;
                color:#ffffff;
                padding:32px 20px;
              "
            >
              <h1 style="margin:0;font-size:32px;font-weight:700;">
                Chatio
              </h1>
              <p style="margin:8px 0 0;font-size:15px;opacity:0.9;">
                Verify your email address
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2
                style="
                  margin:0 0 16px;
                  color:#1f2937;
                  font-size:24px;
                "
              >
                Email Verification
              </h2>
              <p
                style="
                  margin:0 0 20px;
                  color:#4b5563;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                Thanks for signing up for Chatio. Use the verification code
                below to confirm your email address.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <div
                  style="
                    display:inline-block;
                    background:#e8f8f3;
                    color:#00a884;
                    font-size:36px;
                    font-weight:700;
                    letter-spacing:8px;
                    padding:18px 30px;
                    border-radius:12px;
                    border:2px dashed #00a884;
                  "
                >
                  ${code}
                </div>
              </div>
              <p
                style="
                  margin:20px 0 0;
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                This code will expire in 10 minutes. If you did not request
                this verification, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td
              align="center"
              style="
                background:#f9fafb;
                padding:24px;
                color:#6b7280;
                font-size:13px;
              "
            >
              © 2026 Chatio. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  
  console.log("Verification email sent:", info.messageId);
};
