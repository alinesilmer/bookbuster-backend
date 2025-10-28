//OBJETIVO: delegar a sendMail de utils/mailer.js, así se puede cambiar de proveedor de email (SMTP/Resend) 
// sin tocar los controladores, protegiendo la lógica real de envío
//con esto, los controladores ya no saben CÓMO se envía el mail, solo piden que se “mande este correo”

import { sendMail } from "../utils/mailer.js";

export const MailerAdapter = {
  async send(to, subject, html) {
    return await sendMail(to, subject, html);
  },
};
