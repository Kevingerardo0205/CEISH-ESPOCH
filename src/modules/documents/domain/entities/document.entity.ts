import { Protocol } from '../../../protocols/domain/entities/protocol.entity';
import { User } from '../../../auth/domain/entities/user.entity';

export class Document {
  constructor(
    public readonly id: number,
    public readonly protocol: Protocol,
    public readonly protocolId: number,
    public readonly uploadedBy: User,
    public readonly fileName: string | null = null,
    public readonly path: string | null = null,
    public readonly pageCount?: number,
    public readonly hashChecksum?: string,
    public readonly sizeBytes?: number,
    public readonly isConfidential: boolean = true,
    public readonly isValidatedBySecretary: boolean = false,
    public readonly uploadedById?: number,
    public readonly createdAt: Date = new Date(),
  ) {}
}
