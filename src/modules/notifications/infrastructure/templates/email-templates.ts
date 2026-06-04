export const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { width: 100%; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .header { background-color: #003366; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .footer { background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px; }
    .button { display: inline-block; padding: 12px 25px; background-color: #CC0000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .otp-code { display: block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #003366; background-color: #f0f0f0; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; border: 1px dashed #003366; }
    .logo-text { font-weight: bold; color: #CC0000; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CEISH-ESPOCH</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Comité de Ética en Investigación en Seres Humanos - ESPOCH</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordResetTemplate = (name: string, code: string) =>
  getBaseTemplate(`
  <h2>Hola, ${name}</h2>
  <p>Has solicitado restablecer tu contraseña para acceder al sistema CEISH-ESPOCH.</p>
  <p>Usa el siguiente código de seguridad para continuar con el proceso:</p>
  <div class="otp-code">${code}</div>
  <p>Este código expirará en 2 horas.</p>
  <p>Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
`);

export const getEmailConfirmationTemplate = (name: string, code: string) =>
  getBaseTemplate(`
  <h2>Bienvenido/a a CEISH-ESPOCH, ${name}</h2>
  <p>Gracias por registrarte en nuestra plataforma. Para activar tu cuenta, por favor ingresa el siguiente código de verificación en el sistema:</p>
  <div class="otp-code">${code}</div>
  <p>Si no has creado una cuenta, por favor ignora este mensaje.</p>
`);

export const getWelcomeTemplate = (name: string) =>
  getBaseTemplate(`
  <h2>¡Registro Exitoso!</h2>
  <p>Hola, ${name}. Tu cuenta en CEISH-ESPOCH ha sido creada y verificada exitosamente.</p>
  <p>Ya puedes acceder a la plataforma para gestionar tus protocolos de investigación.</p>
  <a href="https://ceish-espoch.edu.ec/login" class="button">Ir al Login</a>
`);

export const getEvaluationAssignmentTemplate = (
  name: string,
  protocolCode: string,
  deadline: string,
) =>
  getBaseTemplate(`
  <h2>Nueva Asignación de Evaluación</h2>
  <p>Estimado/a ${name},</p>
  <p>Se le ha asignado un nuevo protocolo para su revisión ética:</p>
  <p><strong>Código del Protocolo:</strong> ${protocolCode}</p>
  <p><strong>Fecha Límite de Entrega:</strong> ${deadline}</p>
  <p>Por favor, ingrese al sistema para descargar la documentación y completar el formulario de evaluación.</p>
  <a href="https://ceish-espoch.edu.ec/login" class="button">Acceder al Sistema</a>
`);

export const getEvaluationSubmittedTemplate = (
  evaluatorName: string,
  protocolCode: string,
) =>
  getBaseTemplate(`
  <h2>Evaluación Finalizada</h2>
  <p>Se ha recibido un nuevo dictamen de evaluación:</p>
  <p><strong>Protocolo:</strong> ${protocolCode}</p>
  <p><strong>Evaluador:</strong> ${evaluatorName}</p>
  <p>El informe y los aspectos evaluados ya están disponibles en el sistema para su revisión y trámite correspondiente.</p>
`);

export const getReceptionIncompleteTemplate = (
  name: string,
  protocolTitle: string,
  missingItems: string,
  deadline: string,
) =>
  getBaseTemplate(`
  <h2>Documentación Incompleta / Observada</h2>
  <p>Estimado(a) <strong>${name}</strong>,</p>
  <p>Se ha revisado su protocolo: <strong>${protocolTitle}</strong></p>
  <p>Se han encontrado las siguientes observaciones o documentos faltantes:</p>
  <div style="background-color: #fff4f4; border-left: 4px solid #CC0000; padding: 15px; margin: 20px 0; font-family: monospace; white-space: pre-wrap;">${missingItems}</div>
  <p>Tiene un plazo de <strong>15 días laborables</strong> (hasta el <strong>${deadline}</strong>) para subsanar estas observaciones en la plataforma.</p>
  <a href="https://ceish-espoch.edu.ec/dashboard" class="button">Subsanar en el Sistema</a>
`);

export const getReceptionCompleteTemplate = (
  name: string,
  protocolTitle: string,
  ceishCode: string,
) =>
  getBaseTemplate(`
  <h2>Constancia de Recepción de Protocolo</h2>
  <p>Estimado(a) investigador(a) <strong>${name}</strong>:</p>
  <p>Reciba un cordial saludo de parte del Comité de Ética de Investigación en Seres Humanos (CEISH) de la ESPOCH.</p>
  <p>Por medio de la presente, me permito remitir la recepción del protocolo: <strong>“${protocolTitle}”</strong>.</p>
  <div style="text-align: center; margin: 20px 0; background-color: #f7f9fc; padding: 15px; border-radius: 5px; border: 1px solid #e2e8f0;">
    <p style="margin: 5px 0;"><strong>Código de Trámite CEISH:</strong> <span style="font-size: 20px; color: #003366; font-weight: bold;">${ceishCode}</span></p>
  </div>
  <p>Adjunto a este correo encontrará la constancia oficial de recepción en formato PDF.</p>
  <div style="margin: 25px 0; padding: 15px; background-color: #fffbeb; border-left: 4px solid #d97706; border-radius: 4px;">
    <h3 style="color: #b45309; margin-top: 0; font-size: 16px;">⚠️ NOTA IMPORTANTE PARA EL INICIO DE LA EVALUACIÓN:</h3>
    <p style="margin: 5px 0; color: #78350f; font-size: 14px; font-weight: bold;">Se le recuerda que NO se iniciará la evaluación del protocolo si usted como investigador no acepta los tiempos de evaluación.</p>
    <p style="margin: 10px 0 5px 0; color: #78350f; font-size: 14px;">Para agilizar su trámite, <b>ya no es necesario que responda manualmente a este correo</b>. Ahora puede realizar esta aceptación de forma inmediata y digital ingresando a la plataforma con el siguiente botón:</p>
  </div>
  <div style="text-align: center; margin-top: 25px;">
    <a href="https://ceish-espoch.edu.ec/login" class="button" style="background-color: #003366; color: white;">Aceptar Tiempos de Evaluación en el Sistema</a>
  </div>
`);

export const getPresidentNotificationTemplate = (
  protocolTitle: string,
  ceishCode: string,
) =>
  getBaseTemplate(`
  <h2>Nuevo Protocolo para Asignación - CEISH</h2>
  <p><strong>Notificación para Presidencia</strong></p>
  <p>Un nuevo protocolo ha completado la fase de recepción documental:</p>
  <ul>
    <li><strong>Título:</strong> ${protocolTitle}</li>
    <li><strong>Código:</strong> ${ceishCode}</li>
  </ul>
  <p>Por favor, proceda con la asignación de evaluadores en el sistema.</p>
  <a href="https://ceish-espoch.edu.ec/dashboard" class="button">Ir al Sistema</a>
`);

export const getAccountInvitationTemplate = (
  name: string,
  otp: string,
  setupUrl: string,
) =>
  getBaseTemplate(`
  <h2>Invitación al Sistema - CEISH-ESPOCH</h2>
  <p>Bienvenido(a) <strong>${name}</strong>,</p>
  <p>Se ha creado una cuenta institucional para usted en el sistema CEISH-ESPOCH.</p>
  <p>Para configurar su contraseña y activar su acceso, utilice el siguiente código de seguridad:</p>
  <div class="otp-code">${otp}</div>
  <p>Puede completar la configuración haciendo clic en el siguiente enlace:</p>
  <a href="${setupUrl}" class="button">Configurar mi Cuenta</a>
  <p style="margin-top: 20px; font-size: 12px; color: #777;">Si el botón no funciona, copie y pegue la siguiente dirección en su navegador:</p>
  <p style="font-size: 12px; color: #777; word-break: break-all;">${setupUrl}</p>
`);

export const getResolutionEmailTemplate = (
  name: string,
  protocolTitle: string,
  ceishCode: string,
  decision: string,
) =>
  getBaseTemplate(`
  <h2>Resolución de Comité: ${ceishCode}</h2>
  <p>Estimado(a) <strong>${name}</strong>,</p>
  <p>El Comité de Ética de Investigación en Seres Humanos (CEISH-ESPOCH) ha emitido el dictamen final para su protocolo:</p>
  <ul>
    <li><strong>Título:</strong> ${protocolTitle}</li>
    <li><strong>Código:</strong> ${ceishCode}</li>
    <li><strong>Resultado:</strong> <b style="color: #2e7d32;">${decision}</b></li>
  </ul>
  <p>Adjunto a este correo encontrará la carta de resolución oficial en formato PDF.</p>
`);
