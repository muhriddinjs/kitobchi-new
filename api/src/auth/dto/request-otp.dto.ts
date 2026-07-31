import { Matches } from 'class-validator';

export class RequestOtpDto {
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida boʻlishi kerak',
  })
  phone: string;
}
