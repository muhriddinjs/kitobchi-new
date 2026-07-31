import { IsString } from 'class-validator';

export class OpenConversationDto {
  @IsString()
  listingId: string;
}
