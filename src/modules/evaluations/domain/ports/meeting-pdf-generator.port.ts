export interface IMeetingPdfGeneratorPort {
  generateAgendaPdf(meetingId: string): Promise<string>;
}
