import { supabase, handleSupabaseError } from './supabase';
import type { AfricanCountry, AfricanCity, PhoneValidation, Address } from '@/types/features';

export const locationService = {
  // ============================================
  // PAYS
  // ============================================

  // Récupérer tous les pays africains
  async getCountries(): Promise<{ success: boolean; countries?: AfricanCountry[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('african_countries')
        .select('*')
        .order('name');

      if (error) throw error;

      return { success: true, countries: data as AfricanCountry[] };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer un pays par code
  async getCountryByCode(code: string): Promise<{ success: boolean; country?: AfricanCountry; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('african_countries')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;

      return { success: true, country: data as AfricanCountry };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // VILLES
  // ============================================

  // Récupérer les villes d'un pays
  async getCitiesByCountry(countryCode: string): Promise<{ success: boolean; cities?: AfricanCity[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('african_cities')
        .select('*')
        .eq('country_code', countryCode)
        .order('name');

      if (error) throw error;

      return { success: true, cities: data as AfricanCity[] };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Rechercher des villes
  async searchCities(query: string, countryCode?: string): Promise<{ success: boolean; cities?: AfricanCity[]; error?: string }> {
    try {
      let queryBuilder = supabase
        .from('african_cities')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(20);

      if (countryCode) {
        queryBuilder = queryBuilder.eq('country_code', countryCode);
      }

      const { data, error } = await queryBuilder.order('name');

      if (error) throw error;

      return { success: true, cities: data as AfricanCity[] };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================

  // Valider un numéro de téléphone
  validatePhoneNumber(phone: string, countryCode: string, countries: AfricanCountry[]): PhoneValidation {
    const country = countries.find(c => c.code === countryCode);
    
    if (!country) {
      return {
        isValid: false,
        formatted: phone,
        countryCode: '',
        nationalNumber: phone,
        error: 'Pays non trouvé',
      };
    }

    // Nettoyer le numéro
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Si le numéro commence par l'indicatif, l'enlever
    const phoneCodeClean = country.phone_code.replace('+', '');
    if (cleanPhone.startsWith(phoneCodeClean)) {
      cleanPhone = cleanPhone.substring(phoneCodeClean.length);
    }
    
    // Enlever le 0 initial si présent
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    // Vérifier la longueur
    const isValidLength = country.phone_length.includes(cleanPhone.length);

    if (!isValidLength) {
      return {
        isValid: false,
        formatted: phone,
        countryCode: country.phone_code,
        nationalNumber: cleanPhone,
        error: `Le numéro doit contenir ${country.phone_length.join(' ou ')} chiffres pour ${country.name}`,
      };
    }

    // Format E.164
    const formatted = `${country.phone_code}${cleanPhone}`;

    return {
      isValid: true,
      formatted,
      countryCode: country.phone_code,
      nationalNumber: cleanPhone,
    };
  },

  // Formater un numéro pour l'affichage
  formatPhoneDisplay(phone: string, countryCode: string, countries: AfricanCountry[]): string {
    const validation = this.validatePhoneNumber(phone, countryCode, countries);
    
    if (!validation.isValid) {
      return phone;
    }

    const country = countries.find(c => c.code === countryCode);
    if (!country) return phone;

    // Format: +229 XX XX XX XX
    const national = validation.nationalNumber;
    const parts = [];
    
    for (let i = 0; i < national.length; i += 2) {
      parts.push(national.substring(i, i + 2));
    }

    return `${country.phone_code} ${parts.join(' ')}`;
  },
};

export default locationService;
