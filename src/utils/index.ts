import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// UTILITAIRES CSS
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// FORMATAGE DES DATES
// ============================================

export function formatDate(date: string | Date, formatStr: string = 'dd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: fr });
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function getDaysRemaining(expirationDate: string | Date): number {
  const d = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  return Math.max(0, differenceInDays(d, new Date()));
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

// ============================================
// FORMATAGE DES NOMBRES & MONNAIE
// ============================================

export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// FORMATAGE DES IDENTIFIANTS
// ============================================

export function formatWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('229') && cleaned.length === 11) {
    return `+229 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const baseUrl = `https://wa.me/${cleaned}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}

export function getPhoneLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `tel:+${cleaned}`;
}

// ============================================
// VALIDATION
// ============================================

export function isValidBeninPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^229[0-9]{8}$/.test(cleaned);
}

export function isValidClientId(id: string): boolean {
  return /^C\d+$/.test(id);
}

export function isValidTontinierId(id: string): boolean {
  return /^T\d+$/.test(id);
}

export function isValidTontineId(id: string): boolean {
  return /^\d+$/.test(id);
}

// ============================================
// CONSTANTES
// ============================================

export const TONTINE_TYPES = {
  classique: { label: 'Tontine Classique', description: 'Montant fixe à chaque cotisation', color: 'bg-blue-500' },
  flexible: { label: 'Tontine Flexible', description: 'Montant variable selon vos possibilités', color: 'bg-green-500' },
  terme: { label: 'Tontine à Terme', description: 'Montant fixe, durée définie, pas de retrait avant terme', color: 'bg-purple-500' },
} as const;

export const IDENTITY_DOC_TYPES = {
  cni: 'Carte Nationale d\'Identité',
  passport: 'Passeport',
  permis: 'Permis de conduire',
  carte_consulaire: 'Carte consulaire',
} as const;

export const ACCOUNT_STATUSES = {
  pending: { label: 'En attente', color: 'bg-yellow-500' },
  active: { label: 'Actif', color: 'bg-green-500' },
  suspended: { label: 'Suspendu', color: 'bg-red-500' },
  expired: { label: 'Expiré', color: 'bg-gray-500' },
  rejected: { label: 'Refusé', color: 'bg-red-700' },
} as const;

export const TRANSACTION_STATUSES = {
  pending: { label: 'En attente', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  validated: { label: 'Validé', color: 'bg-green-500', textColor: 'text-green-700' },
  rejected: { label: 'Refusé', color: 'bg-red-500', textColor: 'text-red-700' },
  cancelled: { label: 'Annulé', color: 'bg-gray-500', textColor: 'text-gray-700' },
} as const;

export const TONTINE_STATUSES = {
  draft: { label: 'Brouillon', color: 'bg-gray-500' },
  active: { label: 'Active', color: 'bg-green-500' },
  paused: { label: 'En pause', color: 'bg-yellow-500' },
  completed: { label: 'Terminée', color: 'bg-blue-500' },
  cancelled: { label: 'Annulée', color: 'bg-red-500' },
} as const;

// ============================================
// UTILITAIRES DIVERS
// ============================================

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
