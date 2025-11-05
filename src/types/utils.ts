/**
 * Types utilitaires avancés pour améliorer la sécurité et expressivité du code
 * Collection d'utilitaires TypeScript pour le développement type-safe
 */

/**
 * Partial récursif pour les updates profondes
 * Permet de rendre optionnels tous les niveaux d'un objet imbriqué
 * Utile pour les updates partielles de structures complexes
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Améliore l'affichage des types complexes dans les tooltips IntelliSense
 * Force TypeScript à afficher le type déplié plutôt que les références
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Convertit une union de types en intersection
 * Utile pour combiner plusieurs types en un seul avec toutes les propriétés
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Pattern "Branded Types" pour la sécurité de type
 * Ajoute une marque invisible pour distinguer des types primitifs similaires
 * Exemple : éviter de confondre un ID client avec un montant
 */
export type Branded<T, Brand> = T & { __brand: Brand };

/**
 * Arrays garantis non-vides
 * Empêche les tableaux vides qui pourraient causer des erreurs
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Types pour les IDs marqués - sécurité renforcée
 * Chaque type d'ID est marqué pour éviter les confusions
 */
export type ClientId = Branded<number, 'ClientId'>; // ID de client marqué
export type Amount = Branded<number, 'Amount'>; // Montant marqué
export type DateString = Branded<string, 'DateString'>; // Date formatée marquée

/**
 * Types pour les contraintes numériques
 * Sécurité supplémentaire pour les valeurs numériques
 */
export type PositiveNumber = Branded<number, 'Positive'>; // Nombre strictement positif
export type NonNegativeNumber = Branded<number, 'NonNegative'>; // Nombre positif ou nul

/**
 * Utilitaires pour l'introspection de fonctions
 * Extraction de types depuis les signatures de fonctions
 */
export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never;
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Type pour les états de chargement asynchrones
 * Pattern standard pour gérer les états de chargement, données et erreurs
 */
export type LoadingState<T> = {
  data: T | null; // Données chargées ou null
  loading: boolean; // État de chargement en cours
  error: string | null; // Message d'erreur ou null
};

/**
 * Type pour les résultats d'API standardisés
 * Union discriminée pour gérer succès/échec de manière type-safe
 */
export type ApiResponse<T> = {
  success: true;
  data: T; // Données en cas de succès
} | {
  success: false;
  error: string; // Message d'erreur en cas d'échec
};

/**
 * Types pour les filtres et tris
 * Utilisés dans les systèmes de requête et filtrage
 */
export type SortDirection = 'asc' | 'desc'; // Direction de tri
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith'; // Opérateurs de filtrage

/**
 * Utilitaires pour manipuler la nullabilité des propriétés
 * Contrôle fin de l'optionalité des champs d'objets
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; // Rend certaines clés optionnelles
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>; // Rend certaines clés requises

/**
 * Types pour les gestionnaires d'événements
 * Signatures standard pour les callbacks d'événements
 */
export type EventHandler<T = void> = (event: T) => void; // Gestionnaire d'événement générique
export type ChangeHandler<T> = (value: T) => void; // Gestionnaire de changement de valeur

/**
 * Utilitaires pour les promesses
 * Manipulation des types asynchrones
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T; // Extrait le type d'une promesse
export type Promisify<T> = T extends Promise<any> ? T : Promise<T>; // Convertit en promesse si nécessaire

/**
 * Types pour les validations
 * Système de validation type-safe avec résultats détaillés
 */
export type ValidationResult = {
  isValid: true; // Validation réussie
} | {
  isValid: false; // Validation échouée
  errors: string[]; // Liste des erreurs
};

export type Validator<T> = (value: T) => ValidationResult; // Fonction de validation

/**
 * Utilitaires pour les comparaisons
 * Signature standard pour les fonctions de comparaison (comme Array.sort)
 */
export type Comparator<T> = (a: T, b: T) => number; // Retourne -1, 0, ou 1

/**
 * Types pour les collections
 * Alternatives typées aux objets simples
 */
export type Dictionary<T> = Record<string, T>; // Dictionnaire avec clés string
export type NumericDictionary<T> = Record<number, T>; // Dictionnaire avec clés numériques

/**
 * Utilitaires pour les chaînes de caractères
 * Transformations de casse au niveau type
 */
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S; // Première lettre en majuscule

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S; // Première lettre en minuscule

/**
 * Types pour les chemins d'objets (dot notation)
 * Permet de typer les chemins d'accès aux propriétés imbriquées
 * Exemple : 'user.profile.name' pour un objet User
 */
export type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends readonly unknown[]
      ? K | `${K}.${Path<T[K], Exclude<keyof T[K], keyof unknown[]>>}` // Pour les tableaux
      : K | `${K}.${Path<T[K], keyof T[K]>}` // Pour les objets
    : K // Propriété simple
  : never;

/**
 * Extrait le type d'une valeur à un chemin donné
 * Complète Path<T> en permettant d'obtenir le type de la valeur pointée
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest> // Récursion pour les chemins imbriqués
      : never
    : never
  : P extends keyof T
  ? T[P] // Propriété directe
  : never;
