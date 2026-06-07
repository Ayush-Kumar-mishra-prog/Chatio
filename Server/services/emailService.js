const getMailTransport = async () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  try {
    const nodemailer = await import("nodemailer");
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  } catch (error) {
    console.log("nodemailer is not installed; logging verification codes instead.");
    return null;
  }
};

export const sendVerificationEmail = async ({ to, code }) => {
  const transport = await getMailTransport();

  if (!transport) {
    console.log(`Verification code for ${to}: ${code}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Verify your Chatio email",
    text: `Your Chatio verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Chatio verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
};
