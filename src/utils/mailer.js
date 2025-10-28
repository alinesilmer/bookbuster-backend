import nodemailer from "nodemailer";
import { Resend } from "resend";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  EMAIL_REPLY_TO,
  RESEND_API_KEY,
} = process.env;

const hasSMTP = !!SMTP_USER && !!SMTP_PASS;
const hasResend = !!RESEND_API_KEY;

const smtpSecure = String(SMTP_SECURE ?? "false").toLowerCase() === "true";
const smtpPort = Number(SMTP_PORT ?? (smtpSecure ? 465 : 587));

let transporter = null;
if (hasSMTP) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const resend = hasResend ? new Resend(RESEND_API_KEY) : null;

const FROM = MAIL_FROM || "BookBuster <no-reply@bookbuster.app>";
const REPLY_TO = EMAIL_REPLY_TO || undefined;

export async function sendMail(to, subject, html) {
  const toList = Array.isArray(to) ? to : [to];

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: FROM,
        to: toList,
        subject,
        html,
        replyTo: REPLY_TO,
      });
      return { ok: true, id: info.messageId || "" };
    } catch (e) {
      if (!resend) return { ok: false, reason: e?.message || "send_failed" };
    }
  }

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: toList,
        subject,
        html,
        reply_to: REPLY_TO,
      });
      if (error) return { ok: false, reason: error.message || "send_failed" };
      return { ok: true, id: data?.id || "" };
    } catch (e) {
      return { ok: false, reason: e?.message || "send_failed" };
    }
  }

  return { ok: false, reason: "mailer_disabled" };
}

export function verifyMailer() {
  if (transporter) console.log("[mailer] SMTP enabled");
  else if (resend) console.log("[mailer] Resend enabled");
  else console.log("[mailer] disabled");
}

export function approvalEmailHTML({ nombre, email, tempPassword, appUrl }) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0d16;padding:24px;color:#e6e9ef">
    <div style="max-width:560px;margin:0 auto;background:#0f1324;border:1px solid #1e2a4a;border-radius:12px;overflow:hidden">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#323898,#27309F);color:#fff">
        <h2 style="margin:0;font-weight:800">¡Solicitud aprobada!</h2>
        <p style="margin:6px 0 0">Bienvenido/a a BookBuster</p>
      </div>
      <div style="padding:24px">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu solicitud fue aprobada. Podés iniciar sesión con:</p>
        <div style="background:#0b0f20;border:1px solid #1e2a4a;border-radius:10px;padding:16px;margin:12px 0">
          <p style="margin:0"><strong>Usuario:</strong> ${email}</p>
        </div>
        <a href="${appUrl}/login" style="display:inline-block;margin-top:10px;padding:12px 16px;background:#ECC027;color:#0a0a0a;border-radius:10px;text-decoration:none;font-weight:700">Iniciar sesión</a>
      </div>
      <div style="padding:16px 24px;color:#8ea0bc;font-size:12px;border-top:1px solid #1e2a4a">© ${new Date().getFullYear()} BookBuster</div>
    </div>
  </div>`;
}

export function rejectionEmailHTML({ nombre, motivo }) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0d16;padding:24px;color:#e6e9ef">
    <div style="max-width:560px;margin:0 auto;background:#0f1324;border:1px solid #1e2a4a;border-radius:12px;overflow:hidden">
      <div style="padding:20px 24px;background: #323898;color:#fff">
        <h2 style="margin:0;font-weight:800">Solicitud rechazada</h2>
        <p style="margin:6px 0 0">Información sobre tu registro</p>
      </div>
      <div style="padding:24px">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Lamentamos informarte que tu solicitud no fue aprobada.</p>
        <div style="background:#1a1320;border:1px solid #eedf7dff;border-radius:10px;padding:16px;margin:12px 0">
          <p style="margin:0"><strong>Motivo:</strong> ${motivo || "No especificado"}</p>
        </div>
        <p>Podés volver a enviarla si corregís la información necesaria.</p>
      </div>
      <div style="padding:16px 24px;color:#8ea0bc;font-size:12px;border-top:1px solid #1e2a4a">© ${new Date().getFullYear()} BookBuster</div>
    </div>
  </div>`;
}

export function loanCreatedEmailHTML({ nombre, titulo, fecha_vencimiento }) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0d16;padding:24px;color:#e6e9ef">
    <div style="max-width:560px;margin:0 auto;background:#0f1324;border:1px solid #1e2a4a;border-radius:12px;overflow:hidden">
      <div style="padding:20px 24px;background: #323898;color:#fff">
        <h2 style="margin:0;font-weight:800">Préstamo creado</h2>
        <p style="margin:6px 0 0">Gracias por usar BookBuster</p>
      </div>
      <div style="padding:24px">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Registramos tu préstamo del libro <strong>${titulo}</strong>.</p>
        <p><strong>Vence el:</strong> ${fecha_vencimiento}</p>
      </div>
      <div style="padding:16px 24px;color:#8ea0bc;font-size:12px;border-top:1px solid #1e2a4a">© ${new Date().getFullYear()} BookBuster</div>
    </div>
  </div>`;
}

export function loanReminderEmailHTML({ nombre, titulo, fecha_vencimiento }) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b0d16;padding:24px;color:#e6e9ef">
    <div style="max-width:560px;margin:0 auto;background:#0f1324;border:1px solid #1e2a4a;border-radius:12px;overflow:hidden">
      <div style="padding:20px 24px;background: #323898;color:#fff">
        <h2 style="margin:0;font-weight:800;color:#0a0a0a">Recordatorio de vencimiento</h2>
      </div>
      <div style="padding:24px">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Mañana vence tu préstamo de <strong>${titulo}</strong>.</p>
        <p><strong>Fecha de vencimiento:</strong> ${fecha_vencimiento}</p>
      </div>
      <div style="padding:16px 24px;color:#8ea0bc;font-size:12px;border-top:1px solid #1e2a4a">© ${new Date().getFullYear()} BookBuster</div>
    </div>
  </div>`;
}