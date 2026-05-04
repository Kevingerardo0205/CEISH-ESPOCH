export class DocumentValidation {
  constructor(
    public readonly id: number,
    public readonly documentId: number,
    public readonly statusId?: number,
    public readonly observations?: string,
    public readonly validatedByUserId?: number,
    public readonly validationDate: Date = new Date(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
