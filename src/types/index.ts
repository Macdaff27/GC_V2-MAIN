/**
 * Fichier central des définitions de types TypeScript
 * Définit tous les types utilisés dans l'application de gestion de clients
 * Organisé par domaine fonctionnel : UI, données, formulaires
 */

/**
 * Thème de couleurs de l'application
 * Définit la palette complète pour tous les composants UI
 */
export type Palette = {
  background: string; // Couleur de fond principale
  surface: string; // Couleur des surfaces (cartes, modals)
  surfaceBorder: string; // Bordures des surfaces
  accent: string; // Couleur d'accentuation (liens, éléments actifs)
  textPrimary: string; // Texte principal
  textSecondary: string; // Texte secondaire
  searchBackground: string; // Fond des champs de recherche
  searchPlaceholder: string; // Texte placeholder des champs de recherche
  actionButtonBackground: string; // Fond des boutons d'action
  actionButtonBackgroundDisabled: string; // Fond des boutons désactivés
  actionButtonText: string; // Texte des boutons d'action
  // Couleurs spécifiques au composant Switch
  trackOff: string; // Piste du switch à l'état OFF
  trackOn: string; // Piste du switch à l'état ON
  thumbOff: string; // Poignée du switch à l'état OFF
  thumbOn: string; // Poignée du switch à l'état ON
};

/**
 * Noms des bases de données disponibles
 * L'application gère deux bases : principale et archives
 */
export type DatabaseName = 'main' | 'archive';

/**
 * Filtres de statut disponibles pour les clients
 * Utilisé dans l'interface de filtrage des listes
 */
export type StatusFilter = 'all' | 'in-progress' | 'done';

/**
 * Structure d'un frais (supplément) lié à un client
 * Représente un coût additionnel (livraison, etc.)
 */
export type Fee = {
  type: string; // Type de frais (ex: "livraison", "emballage")
  montant: number; // Montant en euros
};

/**
 * Structure d'un numéro de téléphone lié à un client
 * Stocke les coordonnées téléphoniques
 */
export type Phone = {
  numero: string; // Numéro de téléphone formaté
};

/**
 * Structure complète d'un client avec toutes ses relations
 * Représente un client tel qu'utilisé dans l'application (couche métier)
 */
export type ClientWithRelations = {
  id: number; // Identifiant unique auto-généré
  nom: string; // Nom du client
  page: number; // Numéro de page dans le cahier
  note: string; // Notes additionnelles
  montantTotal: number; // Montant total de la commande
  montantRestant: number; // Montant restant à payer
  dateAjout: string; // Date d'ajout (format JJ/MM/AAAA)
  statut: boolean; // True = terminé, False = en cours
  frais: Fee[]; // Liste des frais supplémentaires
  telephones: Phone[]; // Liste des numéros de téléphone
};

/**
 * Structure d'un client importé depuis JSON
 * Champs optionnels car les fichiers d'import peuvent être incomplets ou mal formatés
 * Supporte différents formats de données (string/number pour les montants)
 */
export type ImportedClient = {
  nom?: string; // Nom optionnel
  page?: number; // Page optionnelle
  montantTotal?: number | string; // Montant total (flexible)
  montantRestant?: number | string; // Montant restant (flexible)
  note?: string; // Notes optionnelles
  statut?: string | boolean; // Statut sous différents formats
  telephones?: Array<string>; // Téléphones sous forme de strings simples
  frais?: Array<{ type?: string; montant?: number | string }>; // Frais avec champs optionnels
  dateAjout?: string; // Date d'ajout optionnelle
  dateAdded?: string; // Variante alternative de dateAjout
};

/**
 * Structure d'une ligne client en base de données
 * Représente exactement le format stocké dans SQLite
 * Diffère de ClientWithRelations par les types (number pour statut, null pour note)
 */
export type ClientRow = {
  id: number; // ID unique
  nom: string; // Nom (NOT NULL)
  page: number; // Page (NOT NULL)
  note: string | null; // Notes (NULL autorisé)
  montantTotal: number; // Montant total (NOT NULL DEFAULT 0)
  montantRestant: number; // Montant restant (NOT NULL DEFAULT 0)
  dateAjout: string; // Date d'ajout (NOT NULL)
  statut: number; // Statut (0=en cours, 1=terminé)
};

/**
 * Structure d'une ligne frais en base de données
 * Liée à un client via client_id (clé étrangère)
 */
export type FeeRow = {
  clientId: number; // Référence vers le client
  type: string; // Type de frais
  montant: number; // Montant du frais
};

/**
 * Structure d'une ligne téléphone en base de données
 * Liée à un client via client_id (clé étrangère)
 */
export type PhoneRow = {
  clientId: number; // Référence vers le client
  numero: string; // Numéro de téléphone
};

/**
 * Structure flexible pour l'import JSON
 * Supporte différents formats de fichiers d'import :
 * - Un seul client
 * - Tableau de clients
 * - Objet wrapper avec différentes propriétés possibles
 */
export type JsonImportShape =
  | ImportedClient // Client unique
  | ImportedClient[] // Tableau de clients
  | {
      data?: ImportedClient[] | { items?: ImportedClient[] }; // Format API standard
      results?: ImportedClient[]; // Format alternatif
      clientes?: ImportedClient[]; // Variante française
      clients?: ImportedClient[]; // Variante anglaise
    };

/**
 * Structure d'un frais dans le formulaire
 * Utilise des strings pour faciliter la validation et l'édition
 * Inclut une clé unique pour React (pour les listes dynamiques)
 */
export type ClientFormFee = {
  key: string; // Clé unique pour React (générée)
  type: string; // Type de frais (string pour validation)
  montant: string; // Montant (string pour input text)
};

/**
 * Structure d'un téléphone dans le formulaire
 * Utilise des strings pour faciliter l'édition
 * Inclut une clé unique pour React
 */
export type ClientFormPhone = {
  key: string; // Clé unique pour React (générée)
  numero: string; // Numéro de téléphone (string pour input)
};

/**
 * Valeurs du formulaire de client
 * Structure utilisée par React Hook Form et le modal de formulaire
 * Tous les champs sont des strings sauf statut (boolean) et id (optionnel)
 */
export type ClientFormValues = {
  id?: number; // ID optionnel (présent en édition, absent en création)
  nom: string; // Nom du client
  page: string; // Numéro de page (string pour validation)
  note: string; // Notes
  montantTotal: string; // Montant total (string pour input)
  montantRestant: string; // Montant restant (string pour input)
  dateAjout: string; // Date d'ajout
  statut: boolean; // Statut (boolean pour switch)
  frais: ClientFormFee[]; // Liste des frais du formulaire
  telephones: ClientFormPhone[]; // Liste des téléphones du formulaire
};

/**
 * Props du composant ClientFormModal
 * Définit l'interface complète du modal de formulaire
 */
export type ClientFormModalProps = {
  visible: boolean; // Contrôle la visibilité du modal
  palette: Palette; // Thème de couleurs à appliquer
  initialValues: ClientFormValues | null; // Valeurs initiales (null = création)
  submitting: boolean; // État de soumission en cours
  onClose: () => void; // Callback de fermeture
  onSubmit: (values: ClientFormValues) => void; // Callback de soumission
};
