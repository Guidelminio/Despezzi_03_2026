import nodemailer from 'nodemailer';

export const sendPasswordResetEmail = async (to: string, name: string, resetLink: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = 'Recuperação de Senha - Despezi';
    const html = `
      <h2>Olá ${name},</h2>
      <p>Você solicitou a recuperação da sua senha no Despezi.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #13ec5b; color: #0f172a; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
      <p>Se você não solicitou isso, pode ignorar este email.</p>
      <br/>
      <p>Equipe Despezi</p>
    `;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- MOCK EMAIL SENT ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      console.log('-----------------------');
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Despezi" <contato@despezi.com>',
      to,
      subject,
      html,
    });
    
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

export const sendGoalAlertEmail = async (
  to: string,
  name: string,
  category: string,
  spent: number,
  goal: number,
  alertType: 'warning' | 'exceeded'
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const percentage = ((spent / goal) * 100).toFixed(1);
    
    let subject = '';
    let html = '';

    if (alertType === 'exceeded') {
      subject = `🚨 Alerta: Meta de gastos excedida em ${category}`;
      html = `
        <h2>Olá ${name},</h2>
        <p>Você <strong>excedeu</strong> sua meta de gastos para a categoria <strong>${category}</strong> neste mês.</p>
        <ul>
          <li><strong>Meta:</strong> R$ ${goal.toFixed(2)}</li>
          <li><strong>Gasto Atual:</strong> R$ ${spent.toFixed(2)}</li>
          <li><strong>Porcentagem:</strong> ${percentage}%</li>
        </ul>
        <p>Recomendamos revisar seus gastos para se manter dentro do orçamento!</p>
        <br/>
        <p>Equipe Despezi</p>
      `;
    } else {
      subject = `⚠️ Aviso: Você está próximo do limite em ${category}`;
      html = `
        <h2>Olá ${name},</h2>
        <p>Você já utilizou <strong>${percentage}%</strong> da sua meta de gastos para a categoria <strong>${category}</strong> neste mês.</p>
        <ul>
          <li><strong>Meta:</strong> R$ ${goal.toFixed(2)}</li>
          <li><strong>Gasto Atual:</strong> R$ ${spent.toFixed(2)}</li>
        </ul>
        <p>Fique de olho para não ultrapassar o limite definido!</p>
        <br/>
        <p>Equipe Despezi</p>
      `;
    }

    // If no credentials are provided, we'll just log it (useful for testing without real SMTP)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- MOCK EMAIL SENT ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      console.log('-----------------------');
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Despezi Alertas" <alertas@despezi.com>',
      to,
      subject,
      html,
    });
    
    console.log(`Email alert sent to ${to} for category ${category}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
