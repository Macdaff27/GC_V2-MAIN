/**
 * Configuration d'internationalisation - Préparation pour l'extension future
 * Structure prête pour l'intégration de react-i18next
 */

export type Language = 'fr' | 'en' | 'ar';

export interface TranslationKeys {
  // Navigation
  'nav.clients': string;
  'nav.archive': string;

  // Actions
  'actions.add': string;
  'actions.edit': string;
  'actions.delete': string;
  'actions.save': string;
  'actions.cancel': string;
  'actions.export': string;
  'actions.import': string;

  // Status
  'status.done': string;
  'status.inProgress': string;
  'status.all': string;

  // Messages
  'messages.noClients': string;
  'messages.loading': string;
  'messages.confirmDelete': string;
  'messages.exportSuccess': string;
  'messages.importSuccess': string;

  // Form labels
  'form.name': string;
  'form.page': string;
  'form.amount': string;
  'form.note': string;
  'form.phone': string;

  // Validation
  'validation.required': string;
  'validation.invalidAmount': string;
  'validation.invalidPhone': string;
}

// Traductions françaises (par défaut)
const frTranslations: TranslationKeys = {
  // Navigation
  'nav.clients': 'Clients',
  'nav.archive': 'Archives',

  // Actions
  'actions.add': 'Ajouter',
  'actions.edit': 'Modifier',
  'actions.delete': 'Supprimer',
  'actions.save': 'Enregistrer',
  'actions.cancel': 'Annuler',
  'actions.export': 'Exporter',
  'actions.import': 'Importer',

  // Status
  'status.done': 'Terminé',
  'status.inProgress': 'En cours',
  'status.all': 'Tous',

  // Messages
  'messages.noClients': 'Aucune cliente trouvée',
  'messages.loading': 'Chargement...',
  'messages.confirmDelete': 'Confirmer la suppression ?',
  'messages.exportSuccess': 'Export réussi',
  'messages.importSuccess': 'Import réussi',

  // Form labels
  'form.name': 'Nom',
  'form.page': 'Page',
  'form.amount': 'Montant',
  'form.note': 'Note',
  'form.phone': 'Téléphone',

  // Validation
  'validation.required': 'Ce champ est requis',
  'validation.invalidAmount': 'Montant invalide',
  'validation.invalidPhone': 'Numéro de téléphone invalide',
};

// Traductions anglaises
const enTranslations: TranslationKeys = {
  // Navigation
  'nav.clients': 'Clients',
  'nav.archive': 'Archive',

  // Actions
  'actions.add': 'Add',
  'actions.edit': 'Edit',
  'actions.delete': 'Delete',
  'actions.save': 'Save',
  'actions.cancel': 'Cancel',
  'actions.export': 'Export',
  'actions.import': 'Import',

  // Status
  'status.done': 'Done',
  'status.inProgress': 'In Progress',
  'status.all': 'All',

  // Messages
  'messages.noClients': 'No clients found',
  'messages.loading': 'Loading...',
  'messages.confirmDelete': 'Confirm deletion?',
  'messages.exportSuccess': 'Export successful',
  'messages.importSuccess': 'Import successful',

  // Form labels
  'form.name': 'Name',
  'form.page': 'Page',
  'form.amount': 'Amount',
  'form.note': 'Note',
  'form.phone': 'Phone',

  // Validation
  'validation.required': 'This field is required',
  'validation.invalidAmount': 'Invalid amount',
  'validation.invalidPhone': 'Invalid phone number',
};

// Traductions arabes
const arTranslations: TranslationKeys = {
  // Navigation
  'nav.clients': 'العملاء',
  'nav.archive': 'الأرشيف',

  // Actions
  'actions.add': 'إضافة',
  'actions.edit': 'تعديل',
  'actions.delete': 'حذف',
  'actions.save': 'حفظ',
  'actions.cancel': 'إلغاء',
  'actions.export': 'تصدير',
  'actions.import': 'استيراد',

  // Status
  'status.done': 'مكتمل',
  'status.inProgress': 'قيد التنفيذ',
  'status.all': 'الكل',

  // Messages
  'messages.noClients': 'لم يتم العثور على عملاء',
  'messages.loading': 'جارٍ التحميل...',
  'messages.confirmDelete': 'تأكيد الحذف؟',
  'messages.exportSuccess': 'تم التصدير بنجاح',
  'messages.importSuccess': 'تم الاستيراد بنجاح',

  // Form labels
  'form.name': 'الاسم',
  'form.page': 'الصفحة',
  'form.amount': 'المبلغ',
  'form.note': 'ملاحظة',
  'form.phone': 'الهاتف',

  // Validation
  'validation.required': 'هذا الحقل مطلوب',
  'validation.invalidAmount': 'مبلغ غير صحيح',
  'validation.invalidPhone': 'رقم هاتف غير صحيح',
};

// Collection de toutes les traductions
const translations: Record<Language, TranslationKeys> = {
  fr: frTranslations,
  en: enTranslations,
  ar: arTranslations,
};

// Langue par défaut
let currentLanguage: Language = 'fr';

/**
 * Hook pour utiliser les traductions
 * À remplacer par react-i18next quand disponible
 */
export const useTranslation = () => {
  const t = (key: keyof TranslationKeys): string => {
    return translations[currentLanguage][key];
  };

  const changeLanguage = (language: Language) => {
    currentLanguage = language;
  };

  return {
    t,
    changeLanguage,
    currentLanguage,
  };
};

/**
 * Fonction utilitaire pour les traductions (hors composants)
 */
export const t = (key: keyof TranslationKeys): string => {
  return translations[currentLanguage][key];
};

/**
 * Configuration de la langue
 */
export const setLanguage = (language: Language) => {
  currentLanguage = language;
};

export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

export const getAvailableLanguages = (): Language[] => {
  return Object.keys(translations) as Language[];
};

/**
 * Hook pour les nombres formatés selon la locale
 */
export const useNumberFormatter = () => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString(currentLanguage === 'ar' ? 'ar-DZ' : currentLanguage);
  };

  const formatCurrency = (amount: number): string => {
    return `${formatNumber(amount)} DA`;
  };

  return {
    formatNumber,
    formatCurrency,
  };
};

/**
 * Hook pour les dates formatées selon la locale
 */
export const useDateFormatter = () => {
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(currentLanguage === 'ar' ? 'ar-DZ' : currentLanguage);
  };

  return {
    formatDate,
  };
};
