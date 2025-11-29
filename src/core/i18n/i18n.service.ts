import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AppI18nService {
  constructor(private readonly i18n: I18nService) {}

  t(key: string, args?: Record<string, any>, lang?: string) {
    return this.i18n.translate(key, { args, lang });
  }
}
