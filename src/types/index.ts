export type Palette = {
  background: string;
  surface: string;
  surfaceBorder: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  searchBackground: string;
  searchPlaceholder: string;
  actionButtonBackground: string;
  actionButtonBackgroundDisabled: string;
  actionButtonText: string;
};
export type DatabaseName = 'main' | 'archive';
export type StatusFilter = 'all' | 'in-progress' | 'done';
export type Fee = {
  type: string;
  montant: number;
};
export type Phone = {
  numero: string;
};
export type ClientWithRelations = {
  id: number;
  nom: string;
  page: number;
  note: string;
  montantTotal: number;
  montantRestant: number;
  dateAjout: string;
  statut: boolean;
  frais: Fee[];
  telephones: Phone[];
};
export type ImportedClient = {
  nom?: string;
  page?: number;
  montantTotal?: number | string;
  montantRestant?: number | string;
  note?: string;
  statut?: string | boolean;
  telephones?: Array<string>;
  frais?: Array<{ type?: string; montant?: number | string }>;
  dateAjout?: string;
  dateAdded?: string;
};
export type ClientRow = {
  id: number;
  nom: string;
  page: number;
  note: string | null;
  montantTotal: number;
  montantRestant: number;
  dateAjout: string;
  statut: number;
};
export type FeeRow = {
  clientId: number;
  type: string;
  montant: number;
};
export type PhoneRow = {
  clientId: number;
  numero: string;
};
export type JsonImportShape =
  | ImportedClient
  | ImportedClient[]
  | {
      data?: ImportedClient[] | { items?: ImportedClient[] };
      results?: ImportedClient[];
      clientes?: ImportedClient[];
      clients?: ImportedClient[];
    };

export type ClientFormFee = {
  key: string;
  type: string;
  montant: string;
};
export type ClientFormPhone = {
  key: string;
  numero: string;
};
export type ClientFormValues = {
  id?: number;
  nom: string;
  page: string;
  note: string;
  montantTotal: string;
  montantRestant: string;
  dateAjout: string;
  statut: boolean;
  frais: ClientFormFee[];
  telephones: ClientFormPhone[];
};
export type ClientFormModalProps = {
  visible: boolean;
  palette: Palette;
  initialValues: ClientFormValues | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => void;
};
