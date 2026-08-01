import { IsOptional, IsUUID } from 'class-validator';

export class MarkSoldDto {
  // Optional: the sale may have gone to someone without an account. When
  // present it must be a real user id — the service also checks that the
  // user actually showed interest in this listing.
  @IsOptional()
  @IsUUID()
  soldToUserId?: string;
}
