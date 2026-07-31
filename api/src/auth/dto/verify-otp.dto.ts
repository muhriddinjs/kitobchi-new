import { Matches } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida boʻlishi kerak',
  })
  phone: string;

  @Matches(/^\d{6}$/, { message: 'Kod 6 xonali raqam boʻlishi kerak' })
  code: string;
}
