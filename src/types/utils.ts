/**
 * Types utilitaires avancés pour améliorer la sécurité et expressivité du code
 */

// Partial récursif pour les updates profondes
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Améliore l'affichage des types complexes dans les tooltips
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Convertit une union en intersection
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// Types marqués pour la sécurité de type
export type Branded<T, Brand> = T & { __brand: Brand };

// Arrays garantis non-vides
export type NonEmptyArray<T> = [T, ...T[]];

// Types pour les IDs marqués
export type ClientId = Branded<number, 'ClientId'>;
export type Amount = Branded<number, 'Amount'>;
export type DateString = Branded<string, 'DateString'>;

// Types pour les contraintes
export type PositiveNumber = Branded<number, 'Positive'>;
export type NonNegativeNumber = Branded<number, 'NonNegative'>;

// Utilitaires pour les fonctions
export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never;
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Types pour les états de chargement
export type LoadingState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// Types pour les résultats d'API
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// Types pour les filtres et tris
export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith';

// Utilitaires pour les objets
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Types pour les événements
export type EventHandler<T = void> = (event: T) => void;
export type ChangeHandler<T> = (value: T) => void;

// Utilitaires pour les promesses
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
export type Promisify<T> = T extends Promise<any> ? T : Promise<T>;

// Types pour les validations
export type ValidationResult = {
  isValid: true;
} | {
  isValid: false;
  errors: string[];
};

export type Validator<T> = (value: T) => ValidationResult;

// Utilitaires pour les comparaisons
export type Comparator<T> = (a: T, b: T) => number;

// Types pour les collections
export type Dictionary<T> = Record<string, T>;
export type NumericDictionary<T> = Record<number, T>;

// Utilitaires pour les chaînes
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;

// Types pour les chemins d'objets
export type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends readonly unknown[]
      ? K | `${K}.${Path<T[K], Exclude<keyof T[K], keyof unknown[]>>}`
      : K | `${K}.${Path<T[K], keyof T[K]>}`
    : K
  : never;

export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;
