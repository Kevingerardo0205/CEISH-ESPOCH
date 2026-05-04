export abstract class IEmailServicePort {
  abstract sendPasswordReset(
    email: string,
    token: string,
    name: string,
  ): Promise<void>;
  abstract sendWelcomeEmail(email: string, name: string): Promise<void>;
  abstract sendEmailConfirmation(
    email: string,
    token: string,
    name: string,
  ): Promise<void>;
}
