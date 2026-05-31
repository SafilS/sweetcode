import nodemailer from "nodemailer";

export async function sendWelcomeEmail(toEmail: string, username: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM ?? "SweetCode <noreply@sweetcode.dev>";

  const emailSubject = "Welcome to SweetCode! Let's Defy Gravity 🌌";
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to SweetCode</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 20px;
            margin-top: 0;
            color: #0f172a;
          }
          .content p {
            color: #475569;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          }
          .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SweetCode</h1>
          </div>
          <div class="content">
            <h2>Hello, ${username}! 👋</h2>
            <p>Welcome to SweetCode, a learning-first platform for mastering algorithm design and structured problem solving.</p>
            <p style="background: rgba(37, 99, 235, 0.05); border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 24px 0; line-height: 1.5; font-size: 15px;">
              <strong>💡 Free LeetCode Premium:</strong> We believe in accessible learning. That's why you can study premium LeetCode questions complete with detailed, multilingual solutions on SweetCode for free—no LeetCode Premium subscription required!
            </p>
            <p>Here is what you can do next to jumpstart your practice:</p>
            <ul style="color: #475569; font-size: 16px; padding-left: 20px; margin-bottom: 30px;">
              <li style="margin-bottom: 12px;"><strong>Study Curated Plans</strong>: Walk through handpicked tracks like LeetCode 75 and Top Interview 150.</li>
              <li style="margin-bottom: 12px;"><strong>Explore Multilingual Editorials</strong>: Trace alternative logic implementations side-by-side.</li>
              <li style="margin-bottom: 12px;"><strong>Write Private Notes</strong>: Document your complexity analyses and code summaries inside our integrated scratchpad.</li>
            </ul>
            <div style="text-align: center; margin: 36px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/problems" class="cta-button" target="_blank">
                Start Coding Now
              </a>
            </div>
            <p>If you have any questions or feedback, feel free to reply directly to this email.</p>
            <p>Happy coding!<br/>The SweetCode Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SweetCode. All rights reserved.</p>
            <p>Designed by <a href="https://github.com/SafilS" target="_blank">Mohammed Safil</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // If credentials are not set, log the email send simulation
  if (!host || !user || !pass) {
    console.log("-----------------------------------------");
    console.log("[EMAIL SIMULATION] Welcome email triggered!");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log("SMTP configurations are missing in .env.local.");
    console.log("To send real emails, define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM.");
    console.log("-----------------------------------------");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: emailSubject,
      html: emailHtml
    });
    console.log(`[EMAIL] Welcome email sent successfully to: ${toEmail}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send welcome email:", error);
  }
}
