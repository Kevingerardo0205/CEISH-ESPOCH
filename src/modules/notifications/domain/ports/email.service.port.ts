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
  abstract sendEvaluationAssignment(
    email: string,
    name: string,
    protocolCode: string,
    deadline: Date,
  ): Promise<void>;
  abstract sendEvaluationSubmitted(
    email: string,
    evaluatorName: string,
    protocolCode: string,
  ): Promise<void>;
}
