export abstract class IEmailServicePort {
  abstract sendPasswordReset(
    email: string,
    code: string,
    name: string,
  ): Promise<void>;
  abstract sendWelcomeEmail(email: string, name: string): Promise<void>;
  abstract sendEmailConfirmation(
    email: string,
    code: string,
    name: string,
  ): Promise<void>;
}
