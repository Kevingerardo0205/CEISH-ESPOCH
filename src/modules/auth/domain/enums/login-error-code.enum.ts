/**
 * HU-001 k) Códigos estables de los rechazos de POST /auth/login.
 * El frontend reconoce cada caso por `code`; el mensaje es para el usuario.
 */
export enum LoginErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

export const LOGIN_ERROR_MESSAGES: Readonly<Record<LoginErrorCode, string>> = {
  [LoginErrorCode.INVALID_CREDENTIALS]: 'Correo o contraseña incorrectos.',
  [LoginErrorCode.ACCOUNT_DISABLED]:
    'Su cuenta está desactivada. Contacte al administrador.',
  [LoginErrorCode.EMAIL_NOT_VERIFIED]:
    'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
  [LoginErrorCode.ACCOUNT_LOCKED]:
    'Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde.',
};
