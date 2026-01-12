'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Phone, ChevronDown, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { locationService } from '@/services/location';
import type { AfricanCountry, PhoneValidation } from '@/types/features';

interface PhoneInputProps {
  value?: string;
  countryCode?: string;
  onChange: (phone: string, countryCode: string, validation: PhoneValidation) => void;
  onCountriesLoaded?: (countries: AfricanCountry[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  defaultCountryCode?: string;
}

export function PhoneInput({
  value = '',
  countryCode,
  onChange,
  onCountriesLoaded,
  label = 'Numéro WhatsApp',
  required = false,
  disabled = false,
  placeholder = 'XX XX XX XX',
  error,
  defaultCountryCode = 'BJ',
}: PhoneInputProps) {
  const [countries, setCountries] = useState<AfricanCountry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<AfricanCountry | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [validation, setValidation] = useState<PhoneValidation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les pays
  useEffect(() => {
    const loadCountries = async () => {
      const result = await locationService.getCountries();
      if (result.success && result.countries) {
        setCountries(result.countries);
        onCountriesLoaded?.(result.countries);
        const code = countryCode || defaultCountryCode;
        const country = result.countries.find(c => c.code === code);
        if (country) setSelectedCountry(country);
      }
      setIsLoading(false);
    };
    loadCountries();
  }, []);

  // Valider le numéro
  useEffect(() => {
    if (selectedCountry && phoneNumber) {
      const result = locationService.validatePhoneNumber(phoneNumber, selectedCountry.code, countries);
      setValidation(result);
      onChange(phoneNumber, selectedCountry.code, result);
    }
  }, [phoneNumber, selectedCountry, countries]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const s = searchQuery.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) || c.phone_code.includes(s)
    );
  }, [countries, searchQuery]);

  const handleCountrySelect = (country: AfricanCountry) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const getFlagEmoji = (code: string): string => {
    const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        {/* Sélecteur pays */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled || isLoading}
            className={cn(
              'flex items-center gap-2 px-3 py-3 rounded-xl border bg-white dark:bg-dark-800 transition-all min-w-[130px]',
              showDropdown ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-dark-200 dark:border-dark-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedCountry ? (
              <>
                <span className="text-lg">{getFlagEmoji(selectedCountry.code)}</span>
                <span className="text-sm font-medium text-dark-700 dark:text-dark-300">{selectedCountry.phone_code}</span>
              </>
            ) : (
              <span className="text-sm text-dark-400">Pays</span>
            )}
            <ChevronDown className={cn('w-4 h-4 text-dark-400 transition-transform ml-auto', showDropdown && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-64 mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 max-h-60 overflow-hidden"
              >
                <div className="p-2 border-b border-dark-100 dark:border-dark-700">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-50 dark:bg-dark-900 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors',
                        selectedCountry?.code === country.code && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <span className="text-lg">{getFlagEmoji(country.code)}</span>
                      <span className="text-sm text-dark-900 dark:text-white flex-1 text-left">{country.name}</span>
                      <span className="text-xs text-dark-400">{country.phone_code}</span>
                      {selectedCountry?.code === country.code && <Check className="w-4 h-4 text-primary-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input téléphone */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Phone className="w-5 h-5 text-dark-400" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-dark-800 text-dark-900 dark:text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all',
              error || (validation && !validation.isValid && phoneNumber)
                ? 'border-danger-500'
                : 'border-dark-200 dark:border-dark-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          {/* Indicateur de validation */}
          {phoneNumber && validation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5 text-success-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-danger-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {validation && !validation.isValid && phoneNumber && (
        <p className="text-sm text-danger-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {validation.error}
        </p>
      )}
      {validation && validation.isValid && phoneNumber && (
        <p className="text-sm text-success-600 dark:text-success-400">
          Format: {validation.formatted}
        </p>
      )}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}

export default PhoneInput;
