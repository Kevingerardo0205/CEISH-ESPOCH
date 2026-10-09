import { IMeetingRepositoryPort } from './meeting-repository.port';
import { IMeetingPdfGeneratorPort } from './meeting-pdf-generator.port';

describe('Meeting Ports Interface check', () => {
  it('should compile ports interfaces correctly', () => {
    const repoMock: Partial<IMeetingRepositoryPort> = {};
    const pdfMock: Partial<IMeetingPdfGeneratorPort> = {};
    expect(repoMock).toBeDefined();
    expect(pdfMock).toBeDefined();
  });
});
