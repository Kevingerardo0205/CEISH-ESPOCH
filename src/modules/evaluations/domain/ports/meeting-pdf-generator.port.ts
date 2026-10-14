export interface IMeetingPdfGeneratorPort {
  generateAgendaPdf(
    meetingId: string,
  ): Promise<{ url: string; buffer: Buffer }>;
}
