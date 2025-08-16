import { useTranslation } from 'next-i18next';

export default function useSimpleTranslation(ns = 'common') {
  const { t } = useTranslation(ns);
  return t;
}
