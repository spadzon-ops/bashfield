import { useTranslation } from 'next-i18next';

export default function useComprehensiveTranslations(ns = 'common') {
  const { t, i18n } = useTranslation(ns);
  return { t, currentLang: i18n.language };
}
