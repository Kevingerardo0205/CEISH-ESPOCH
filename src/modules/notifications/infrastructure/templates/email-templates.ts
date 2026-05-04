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

export const getPasswordResetTemplate = (name: string, url: string) => getBaseTemplate(`
  <h2>Hola, ${name}</h2>
  <p>Has solicitado restablecer tu contraseña para acceder al sistema CEISH-ESPOCH.</p>
  <p>Haz clic en el siguiente botón para continuar con el proceso:</p>
  <a href="${url}" class="button">Restablecer Contraseña</a>
  <p>Este enlace expirará en 2 horas.</p>
  <p>Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
`);

export const getEmailConfirmationTemplate = (name: string, url: string) => getBaseTemplate(`
  <h2>Bienvenido/a a CEISH-ESPOCH, ${name}</h2>
  <p>Gracias por registrarte en nuestra plataforma. Para activar tu cuenta, por favor confirma tu dirección de correo electrónico.</p>
  <p>Haz clic en el siguiente botón para confirmar tu cuenta:</p>
  <a href="${url}" class="button">Confirmar Correo Electrónico</a>
  <p>Si no has creado una cuenta, por favor ignora este mensaje.</p>
`);

export const getWelcomeTemplate = (name: string) => getBaseTemplate(`
  <h2>¡Registro Exitoso!</h2>
  <p>Hola, ${name}. Tu cuenta en CEISH-ESPOCH ha sido creada y verificada exitosamente.</p>
  <p>Ya puedes acceder a la plataforma para gestionar tus protocolos de investigación.</p>
  <a href="https://ceish-espoch.edu.ec/login" class="button">Ir al Login</a>
`);
