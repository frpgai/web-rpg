import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import attributesPt from './locales/pt/attributes.json';
import skillsPt from './locales/pt/skills.json';
import commonPt from './locales/pt/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        attributes: attributesPt,
        skills: skillsPt,
        common: commonPt,
      },
    },
    lng: 'pt',
    fallbackLng: 'pt',
    ns: ['attributes', 'skills', 'common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
