import nodemailer from 'nodemailer';

export type CrystalBioEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type CrystalBioMailer = {
  isConfigured: boolean;
  send(email: CrystalBioEmail): Promise<{ delivered: boolean; reason?: string }>;
};

export function createCrystalBioMailerFromEnv(env: NodeJS.ProcessEnv = process.env): CrystalBioMailer {
  const host = env.CRYSTALBIO_SMTP_HOST;
  const port = Number(env.CRYSTALBIO_SMTP_PORT ?? 587);
  const user = env.CRYSTALBIO_SMTP_USER;
  const pass = env.CRYSTALBIO_SMTP_PASS;
  const from = env.CRYSTALBIO_EMAIL_FROM ?? user;
  const secure = env.CRYSTALBIO_SMTP_SECURE === 'true' || port === 465;

  if (!host || !from) {
    return {
      isConfigured: false,
      async send() {
        return { delivered: false, reason: 'SMTP is not configured' };
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return {
    isConfigured: true,
    async send(email) {
      await transporter.sendMail({ from, ...email });
      return { delivered: true };
    },
  };
}
