export function meetingPdfUrl(id: string): string {
  return `/api/evaluations/meetings/${id}/pdf`;
}
