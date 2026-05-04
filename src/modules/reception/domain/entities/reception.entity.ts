export class Reception {
  constructor(
    public readonly id: number,
    public readonly protocolId: number,
    public readonly receptionDate: Date,
    public readonly statusId?: number,
    public readonly hasMissingItems: boolean = false,
    public readonly missingItemsList?: string,
    public readonly missingItemsNotificationDate?: Date,
    public readonly completionDeadlineDays: number = 15,
    public readonly completionDeadlineDate?: Date,
    public readonly isCertificateIssued: boolean = false,
    public readonly certificateDate?: Date,
    public readonly responseDeadlineDays?: number,
    public readonly generatedCeishCode?: string,
    public readonly observations?: string,
    public readonly createdByUserId?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
