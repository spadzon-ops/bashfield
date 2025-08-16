import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

export default function LanguageToggle({ className }) {
  const { i18n } = useTranslation();

  const onChange = (e) => {
    const next = e.target.value;
    if (next && next !== i18n.language) {
      i18n.changeLanguage(next);
    }
  };

  return (
    <select
      aria-label="Language"
      value={i18n.language}
      onChange={onChange}
      className={className}
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
      <option value="ku">کوردی</option>
    </select>
  );
}
