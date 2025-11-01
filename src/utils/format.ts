import type { ImportedClient, JsonImportShape } from '../types';

export const pad = (value: number): string => value.toString().padStart(2, '0');

export const formatDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

export const normalizeParsedInput = (raw: JsonImportShape): ImportedClient[] => {
  const ensureArray = (candidate: unknown): ImportedClient[] => {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate.filter((entry): entry is ImportedClient => !!entry);
  };

  if (Array.isArray(raw)) {
    return ensureArray(raw);
  }

  if (raw && typeof raw === 'object') {
    const typed = raw as {
      data?: ImportedClient[] | { items?: ImportedClient[] };
      results?: ImportedClient[];
      clientes?: ImportedClient[];
      clients?: ImportedClient[];
    };

    const collected: ImportedClient[] = [];
    const pushCollection = (value: unknown) => {
      collected.push(...ensureArray(value));
    };

    pushCollection(typed.data);
    if (typed.data && !Array.isArray(typed.data) && typeof typed.data === 'object') {
      const nested = (typed.data as { items?: ImportedClient[] }).items;
      pushCollection(nested);
    }
    pushCollection(typed.results);
    pushCollection(typed.clientes);
    pushCollection(typed.clients);

    if (collected.length > 0) {
      return collected;
    }

    return [raw as ImportedClient];
  }

  return [];
};

export const formatDateForStorage = (value?: string): string => {
  if (!value) {
    return formatDate(new Date());
  }

  const trimmed = value.trim();
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = trimmed.match(ddmmyyyy);
  let parsed: Date | null = null;

  if (match) {
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm) - 1; // 0-indexed
    const year = Number(yyyy);
    const candidate = new Date(year, month, day);
    parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
  } else {
    const candidate = new Date(trimmed);
    parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  return formatDate(parsed ?? new Date());
};

export const normalizeAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeStatus = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    const ascii = normalized
      .normalize('NFD')
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code < 0x0300 || code > 0x036F;
      })
      .join('');
    if (ascii === '1' || ascii === 'true' || ascii === 'oui') {
      return true;
    }
    if (ascii === '0' || ascii === 'false' || ascii === 'non') {
      return false;
    }
    if (
      ascii === 'termine' ||
      ascii === 'terminee' ||
      ascii === 'paye' ||
      ascii === 'payee' ||
      ascii === 'regle' ||
      ascii === 'reglee' ||
      ascii === 'solde' ||
      ascii === 'soldes'
    ) {
      return true;
    }
  }
  return false;
};

export const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const buildExportFileName = (date = new Date()): string =>
  `clients-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`;

export const formatCurrency = (amount: number): string =>
  `${Math.round(amount).toLocaleString('fr-FR')} DA`;
