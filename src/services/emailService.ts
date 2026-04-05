import nodemailer from 'nodemailer';

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
