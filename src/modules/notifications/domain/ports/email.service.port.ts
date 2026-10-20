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
    plazo: number,
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
    deadline: Date | null,
  ): Promise<void>;
  abstract sendEvaluationSubmitted(
    email: string,
    evaluatorName: string,
    protocolCode: string,
  ): Promise<void>;

  abstract sendCallNotification(
    email: string,
    name: string,
    callCode: string,
    meetingDate: Date,
    meetingTime: string,
    placeName: string,
    pdfBuffer: Buffer,
  ): Promise<void>;

  abstract sendUnscheduledProtocolsAlert(
    email: string,
    name: string,
    protocols: Array<{ code: string; reason: string }>,
  ): Promise<void>;

  abstract sendRiskLevelDesignated(
    email: string,
    name: string,
    protocolCode: string,
    reviewType: string,
  ): Promise<void>;

  abstract sendRiskDiscrepancyAlert(
    email: string,
    protocolCode: string,
    codesProposed: string[],
  ): Promise<void>;
}
