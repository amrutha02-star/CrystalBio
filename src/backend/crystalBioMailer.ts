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

const unconfiguredMailer = (reason: string): CrystalBioMailer => ({
  isConfigured: false,
  async send() {
    return { delivered: false, reason };
  },
});

function createResendMailer(env: NodeJS.ProcessEnv): CrystalBioMailer {
  const apiKey = env.CRYSTALBIO_RESEND_API_KEY;
  const from = env.CRYSTALBIO_EMAIL_FROM;
  const endpoint = env.CRYSTALBIO_RESEND_ENDPOINT ?? 'https://api.resend.com/emails';

  if (!apiKey || !from) return unconfiguredMailer('Resend API key or sender email is not configured');

  return {
    isConfigured: true,
    async send(email) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email.to],
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend email failed (${response.status}): ${body}`);
      }
      return { delivered: true };
    },
  };
}

function createSmtpMailer(env: NodeJS.ProcessEnv): CrystalBioMailer {
  const host = env.CRYSTALBIO_SMTP_HOST;
  const port = Number(env.CRYSTALBIO_SMTP_PORT ?? 587);
  const user = env.CRYSTALBIO_SMTP_USER;
  const pass = env.CRYSTALBIO_SMTP_PASS;
  const from = env.CRYSTALBIO_EMAIL_FROM ?? user;
  const secure = env.CRYSTALBIO_SMTP_SECURE === 'true' || port === 465;

  if (!host || !from) return unconfiguredMailer('SMTP is not configured');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: Number(env.CRYSTALBIO_SMTP_CONNECTION_TIMEOUT_MS ?? 10_000),
    greetingTimeout: Number(env.CRYSTALBIO_SMTP_GREETING_TIMEOUT_MS ?? 10_000),
    socketTimeout: Number(env.CRYSTALBIO_SMTP_SOCKET_TIMEOUT_MS ?? 15_000),
  });

  return {
    isConfigured: true,
    async send(email) {
      await transporter.sendMail({ from, ...email });
      return { delivered: true };
    },
  };
}

export function createCrystalBioMailerFromEnv(env: NodeJS.ProcessEnv = process.env): CrystalBioMailer {
  if (env.CRYSTALBIO_EMAIL_PROVIDER === 'resend' || env.CRYSTALBIO_RESEND_API_KEY) {
    return createResendMailer(env);
  }
  return createSmtpMailer(env);
}
