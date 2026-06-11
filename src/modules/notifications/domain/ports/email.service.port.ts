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

  abstract sendAccountInvitation(
    email: string,
    otp: string,
    name: string,
  ): Promise<void>;

  abstract sendReceptionIncomplete(
    email: string,
    name: string,
    protocolTitle: string,
    missingItems: string,
    deadline: Date,
  ): Promise<void>;

  abstract sendReceptionComplete(
    email: string,
    name: string,
    protocolTitle: string,
    ceishCode: string,
    pdfBuffer: Buffer,
  ): Promise<void>;

  abstract sendResolutionEmail(
    email: string,
    name: string,
    protocolTitle: string,
    ceishCode: string,
    decision: string,
    pdfBuffer: Buffer,
    additionalAttachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void>;

  abstract notifyPresidentNewProtocol(
    presidentEmail: string,
    protocolTitle: string,
    ceishCode: string,
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
