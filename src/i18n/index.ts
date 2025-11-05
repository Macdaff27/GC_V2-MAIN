/**
 * Configuration d'internationalisation - Préparation pour l'extension future
 * Structure prête pour l'intégration de react-i18next
 * Fournit un système d'internationalisation léger avec support français/arabe/anglais
 */

/**
 * Langues supportées par l'application
 * 'fr' = Français, 'en' = Anglais, 'ar' = Arabe
 */
export type Language = 'fr' | 'en' | 'ar';

/**
 * Interface définissant toutes les clés de traduction disponibles
 * Utilise des clés en dot notation pour une organisation logique
 * Chaque clé correspond à une chaîne traduisible dans l'interface
 */
export interface TranslationKeys {
  // Navigation - Éléments de menu et onglets
  'nav.clients': string; // Onglet "Clients"
  'nav.archive': string; // Onglet "Archives"

  // Actions - Boutons et actions utilisateur
  'actions.add': string; // Bouton "Ajouter"
  'actions.edit': string; // Bouton "Modifier"
  'actions.delete': string; // Bouton "Supprimer"
  'actions.save': string; // Bouton "Enregistrer"
  'actions.cancel': string; // Bouton "Annuler"
  'actions.export': string; // Bouton "Exporter"
  'actions.import': string; // Bouton "Importer"

  // Status - États des clients et filtres
  'status.done': string; // Statut "Terminé"
  'status.inProgress': string; // Statut "En cours"
  'status.all': string; // Filtre "Tous"

  // Messages - Notifications et états vides
  'messages.noClients': string; // Message "Aucune cliente trouvée"
  'messages.loading': string; // Indicateur "Chargement..."
  'messages.confirmDelete': string; // Confirmation de suppression
  'messages.exportSuccess': string; // Succès d'export
  'messages.importSuccess': string; // Succès d'import

  // Form labels - Étiquettes des champs de formulaire
  'form.name': string; // Champ "Nom"
  'form.page': string; // Champ "Page"
  'form.amount': string; // Champ "Montant"
  'form.note': string; // Champ "Note"
  'form.phone': string; // Champ "Téléphone"

  // Validation - Messages d'erreur de validation
  'validation.required': string; // Champ requis
  'validation.invalidAmount': string; // Montant invalide
  'validation.invalidPhone': string; // Téléphone invalide
}

// Traductions françaises (langue par défaut de l'application)
const frTranslations: TranslationKeys = {
  // Navigation - Éléments d'interface principaux
  'nav.clients': 'Clients', // Onglet principal
  'nav.archive': 'Archives', // Section archives

  // Actions - Boutons et interactions utilisateur
  'actions.add': 'Ajouter', // Ajouter un nouveau client
  'actions.edit': 'Modifier', // Éditer un client existant
  'actions.delete': 'Supprimer', // Supprimer un client
  'actions.save': 'Enregistrer', // Sauvegarder les modifications
  'actions.cancel': 'Annuler', // Annuler l'action en cours
  'actions.export': 'Exporter', // Exporter les données
  'actions.import': 'Importer', // Importer des données

  // Status - États des commandes clients
  'status.done': 'Terminé', // Commande finalisée
  'status.inProgress': 'En cours', // Commande en préparation
  'status.all': 'Tous', // Tous les statuts confondus

  // Messages - Notifications utilisateur et états
  'messages.noClients': 'Aucune cliente trouvée', // État vide
  'messages.loading': 'Chargement...', // Indicateur de chargement
  'messages.confirmDelete': 'Confirmer la suppression ?', // Dialogue de confirmation
  'messages.exportSuccess': 'Export réussi', // Confirmation d'export
  'messages.importSuccess': 'Import réussi', // Confirmation d'import

  // Form labels - Étiquettes des champs de formulaire
  'form.name': 'Nom', // Nom du client
  'form.page': 'Page', // Numéro de page dans le cahier
  'form.amount': 'Montant', // Montant de la commande
  'form.note': 'Note', // Notes additionnelles
  'form.phone': 'Téléphone', // Numéro de téléphone

  // Validation - Messages d'erreur pour la validation des formulaires
  'validation.required': 'Ce champ est requis', // Champ obligatoire non rempli
  'validation.invalidAmount': 'Montant invalide', // Format de montant incorrect
  'validation.invalidPhone': 'Numéro de téléphone invalide', // Format de téléphone incorrect
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

// Collection de toutes les traductions indexées par langue
const translations: Record<Language, TranslationKeys> = {
  fr: frTranslations, // Français (défaut)
  en: enTranslations, // Anglais
  ar: arTranslations, // Arabe
};

// État global de la langue actuelle (mutable pour simplicité)
let currentLanguage: Language = 'fr';

/**
 * Hook principal pour l'internationalisation dans les composants React
 * Fournit les fonctions de traduction et changement de langue
 * Architecture simple prête à être remplacée par react-i18next
 */
export const useTranslation = () => {
  /**
   * Fonction de traduction principale
   * @param key - Clé de traduction (type-safe grâce à keyof)
   * @returns Chaîne traduite dans la langue actuelle
   */
  const t = (key: keyof TranslationKeys): string => {
    return translations[currentLanguage][key];
  };

  /**
   * Change la langue de l'application
   * @param language - Nouvelle langue à utiliser
   */
  const changeLanguage = (language: Language) => {
    currentLanguage = language;
  };

  return {
    t, // Fonction de traduction
    changeLanguage, // Changement de langue
    currentLanguage, // Langue actuelle (pour l'UI)
  };
};

/**
 * Fonction utilitaire de traduction pour le code hors composants
 * Utile pour les utilitaires, les hooks personnalisés, etc.
 * @param key - Clé de traduction
 * @returns Chaîne traduite
 */
export const t = (key: keyof TranslationKeys): string => {
  return translations[currentLanguage][key];
};

/**
 * Fonctions utilitaires pour la gestion globale de la langue
 * Permettent de contrôler la langue depuis n'importe où dans l'app
 */

/**
 * Définit la langue globale de l'application
 * @param language - Langue à définir
 */
export const setLanguage = (language: Language) => {
  currentLanguage = language;
};

/**
 * Récupère la langue actuellement active
 * @returns Langue actuelle
 */
export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

/**
 * Liste toutes les langues disponibles
 * @returns Tableau des langues supportées
 */
export const getAvailableLanguages = (): Language[] => {
  return Object.keys(translations) as Language[];
};

/**
 * Hook pour le formatage des nombres selon la locale
 * Adapte automatiquement le format selon la langue (séparateurs, etc.)
 */
export const useNumberFormatter = () => {
  /**
   * Formate un nombre selon la locale actuelle
   * @param num - Nombre à formater
   * @returns Nombre formaté (ex: "1 234,56" en français)
   */
  const formatNumber = (num: number): string => {
    // Utilise ar-DZ pour l'arabe (Algérien) sinon la langue directement
    return num.toLocaleString(currentLanguage === 'ar' ? 'ar-DZ' : currentLanguage);
  };

  /**
   * Formate un montant en devise (Dinars Algériens)
   * @param amount - Montant à formater
   * @returns Montant formaté avec devise (ex: "1 234,56 DA")
   */
  const formatCurrency = (amount: number): string => {
    return `${formatNumber(amount)} DA`;
  };

  return {
    formatNumber, // Formatage de nombres
    formatCurrency, // Formatage de montants
  };
};

/**
 * Hook pour le formatage des dates selon la locale
 * Adapte automatiquement le format selon la langue et la culture
 */
export const useDateFormatter = () => {
  /**
   * Formate une date selon la locale actuelle
   * @param date - Date à formater (Date ou string)
   * @returns Date formatée selon la locale (ex: "15/01/2024" en français)
   */
  const formatDate = (date: Date | string): string => {
    // Conversion si nécessaire
    const d = typeof date === 'string' ? new Date(date) : date;
    // Utilise ar-DZ pour l'arabe, sinon la langue directement
    return d.toLocaleDateString(currentLanguage === 'ar' ? 'ar-DZ' : currentLanguage);
  };

  return {
    formatDate, // Formatage de dates
  };
};
