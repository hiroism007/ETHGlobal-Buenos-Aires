import { useLanguage } from '../contexts/LanguageContext';

function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="language-toggle"
      title={language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
    >
      {language === 'ja' ? 'EN' : 'JA'}
    </button>
  );
}

export default LanguageToggle;
