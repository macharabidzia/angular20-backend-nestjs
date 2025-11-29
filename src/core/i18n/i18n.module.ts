import { Global, Module } from '@nestjs/common';
import {
  I18nModule,
  QueryResolver,
  HeaderResolver,
  CookieResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['x-lang', 'accept-language']),
        new CookieResolver(['lang']),
      ],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
