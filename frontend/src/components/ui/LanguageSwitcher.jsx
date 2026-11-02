import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Globe } from 'lucide-react';
import { setLanguage } from '../../store/slices/uiSlice';
import { LANGUAGES } from '../../utils/constants';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector((s) => s.ui.language);

  const change = (code) => {
    dispatch(setLanguage(code));
    i18n.changeLanguage(code);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe size={16} className="pointer-events-none absolute left-3 text-slate-400" />
      <select
        value={language}
        onChange={(e) => change(e.target.value)}
        aria-label="Select language"
        className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-7 text-sm font-medium text-slate-600 transition-colors hover:text-brand-600 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
