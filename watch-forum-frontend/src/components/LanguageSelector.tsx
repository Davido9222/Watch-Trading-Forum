// ============================================
// LANGUAGE SELECTOR COMPONENT
// Dropdown for selecting website language
// Shows flag emoji and native language name
// ============================================

import React, { useState } from 'react';
import { useLanguageStore, SUPPORTED_LANGUAGES, type LanguageCode } from '@/stores/languageStore';
import { ChevronDown, Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage, getCurrentLanguage, t } = useLanguageStore();
  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={t('auth.language')}
      >
        <span className="text-xl" role="img" aria-label={currentLang.name}>
          {currentLang.flag}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Globe className="h-4 w-4" />
                <span>{t('auth.selectLanguage')}</span>
              </div>
            </div>
            
            {/* Language List */}
            <div className="py-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                    currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl flex-shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                  {currentLanguage === lang.code && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
