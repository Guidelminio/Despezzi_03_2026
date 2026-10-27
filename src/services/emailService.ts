import nodemailer from 'nodemailer';
import { isValidEmailAddress } from '../utils/emailValidation.ts';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

function hasSmtpCredentials(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const sendPasswordResetEmail = async (to: string, name: string, resetLink: string) => {
  if (process.env.DEMO_MODE === 'true') return false;
  if (!isValidEmailAddress(to)) return false;
  if (!hasSmtpCredentials()) {
    // Não registrar o link: ele contém o segredo de uso único para redefinição.
    console.info('E-mail de redefinição não enviado: configure SMTP para habilitar a entrega.');
    return false;
  }

  try {
    const html = `
      <h2>Olá ${escapeHtml(name)},</h2>
      <p>Você solicitou a recuperação da sua senha no Despezi.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <a href="${escapeHtml(resetLink)}" style="display:inline-block;padding:10px 20px;background-color:#13ec5b;color:#0f172a;text-decoration:none;border-radius:5px;font-weight:bold;">Redefinir Senha</a>
      <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
      <p>Equipe Despezi</p>
    `;
    await createTransport().sendMail({
      from: process.env.SMTP_FROM || 'Despezi <contato@despezi.com>',
      to,
      subject: 'Recuperação de senha — Despezi',
      html,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    console.info('E-mail de redefinição enviado.');
    return true;
  } catch {
    console.error('Falha ao enviar e-mail de redefinição.');
    return false;
  }
};

export const sendGoalAlertEmail = async (
  to: string,
  name: string,
  category: string,
  spent: number,
  goal: number,
  alertType: 'warning' | 'exceeded',
) : Promise<boolean> => {
  if (process.env.DEMO_MODE === 'true') return false;
  if (!isValidEmailAddress(to)) return false;
  if (!hasSmtpCredentials()) {
    return false;
  }

  try {
    const safeName = escapeHtml(name);
    const safeCategory = escapeHtml(category);
    const percentage = goal > 0 ? ((spent / goal) * 100).toFixed(1) : '0.0';
    const exceeded = alertType === 'exceeded';
    const subject = exceeded
      ? `Alerta: limite de gastos excedido em ${category}`
      : `Aviso: próximo do limite de gastos em ${category}`;
    const html = `
      <h2>Olá ${safeName},</h2>
      <p>${exceeded ? 'Você excedeu' : 'Você já utilizou'} sua meta de gastos para <strong>${safeCategory}</strong> neste mês.</p>
      <ul>
        <li><strong>Limite:</strong> R$ ${goal.toFixed(2)}</li>
        <li><strong>Gasto atual:</strong> R$ ${spent.toFixed(2)}</li>
        <li><strong>Percentual:</strong> ${percentage}%</li>
      </ul>
      <p>${exceeded ? 'Recomendamos revisar seus gastos.' : 'Fique de olho para não ultrapassar o limite definido.'}</p>
      <p>Equipe Despezi</p>
    `;
    await createTransport().sendMail({
      from: process.env.SMTP_FROM || 'Despezi Alertas <alertas@despezi.com>',
      to,
      subject,
      html,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    console.info('Alerta financeiro enviado por e-mail.');
    return true;
  } catch {
    console.error('Falha ao enviar alerta financeiro por e-mail.');
    return false;
  }
};
