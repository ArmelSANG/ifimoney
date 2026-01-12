'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { locationService } from '@/services/location';
import type { AfricanCountry, AfricanCity, Address } from '@/types/features';

interface AddressSelectorProps {
  value?: Partial<Address>;
  onChange: (address: Address) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function AddressSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
}: AddressSelectorProps) {
  const [countries, setCountries] = useState<AfricanCountry[]>([]);
  const [cities, setCities] = useState<AfricanCity[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const [selectedCountry, setSelectedCountry] = useState<AfricanCountry | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(value?.city || '');
  const [address, setAddress] = useState<string>(value?.address || '');

  // Charger les pays au montage
  useEffect(() => {
    const loadCountries = async () => {
      const result = await locationService.getCountries();
      if (result.success && result.countries) {
        setCountries(result.countries);
        
        // Si une valeur initiale existe, sélectionner le pays
        if (value?.country_code) {
          const country = result.countries.find(c => c.code === value.country_code);
          if (country) {
            setSelectedCountry(country);
          }
        }
      }
      setIsLoadingCountries(false);
    };
    loadCountries();
  }, [value?.country_code]);

  // Charger les villes quand le pays change
  useEffect(() => {
    if (selectedCountry) {
      const loadCities = async () => {
        setIsLoadingCities(true);
        const result = await locationService.getCitiesByCountry(selectedCountry.code);
        if (result.success && result.cities) {
          setCities(result.cities);
        }
        setIsLoadingCities(false);
      };
      loadCities();
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  // Filtrer les pays
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    const search = countrySearch.toLowerCase();
    return countries.filter(
      c => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
    );
  }, [countries, countrySearch]);

  // Filtrer les villes
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const search = citySearch.toLowerCase();
    return cities.filter(c => c.name.toLowerCase().includes(search));
  }, [cities, citySearch]);

  // Mettre à jour le parent
  useEffect(() => {
    if (selectedCountry) {
      onChange({
        country_code: selectedCountry.code,
        city: selectedCity,
        address: address,
        phone_country_code: selectedCountry.phone_code,
      });
    }
  }, [selectedCountry, selectedCity, address, onChange]);

  const handleCountrySelect = (country: AfricanCountry) => {
    setSelectedCountry(country);
    setSelectedCity('');
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const handleCitySelect = (city: AfricanCity) => {
    setSelectedCity(city.name);
    setShowCityDropdown(false);
    setCitySearch('');
  };

  return (
    <div className="space-y-4">
      {/* Sélection du pays */}
      <div className="relative">
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
          Pays {required && <span className="text-danger-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => !disabled && setShowCountryDropdown(!showCountryDropdown)}
          disabled={disabled || isLoadingCountries}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-white dark:bg-dark-800 text-left transition-all',
            showCountryDropdown
              ? 'border-primary-500 ring-2 ring-primary-500/20'
              : 'border-dark-200 dark:border-dark-700',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-danger-500'
          )}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-dark-400" />
            <span className={cn(
              selectedCountry ? 'text-dark-900 dark:text-white' : 'text-dark-400'
            )}>
              {isLoadingCountries
                ? 'Chargement...'
                : selectedCountry
                ? selectedCountry.name
                : 'Sélectionner un pays'}
            </span>
          </div>
          <ChevronDown className={cn(
            'w-5 h-5 text-dark-400 transition-transform',
            showCountryDropdown && 'rotate-180'
          )} />
        </button>

        <AnimatePresence>
          {showCountryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 max-h-60 overflow-hidden"
            >
              {/* Recherche */}
              <div className="p-2 border-b border-dark-100 dark:border-dark-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un pays..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-dark-50 dark:bg-dark-900 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Liste */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors',
                      selectedCountry?.code === country.code && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFlagEmoji(country.code)}</span>
                      <span className="text-sm text-dark-900 dark:text-white">{country.name}</span>
                      <span className="text-xs text-dark-400">{country.phone_code}</span>
                    </div>
                    {selectedCountry?.code === country.code && (
                      <Check className="w-4 h-4 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sélection de la ville */}
      {selectedCountry && (
        <div className="relative">
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
            Ville {required && <span className="text-danger-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => !disabled && setShowCityDropdown(!showCityDropdown)}
            disabled={disabled || isLoadingCities}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-white dark:bg-dark-800 text-left transition-all',
              showCityDropdown
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-dark-200 dark:border-dark-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn(
              selectedCity ? 'text-dark-900 dark:text-white' : 'text-dark-400'
            )}>
              {isLoadingCities
                ? 'Chargement...'
                : selectedCity || 'Sélectionner une ville'}
            </span>
            <ChevronDown className={cn(
              'w-5 h-5 text-dark-400 transition-transform',
              showCityDropdown && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showCityDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 max-h-60 overflow-hidden"
              >
                {/* Recherche */}
                <div className="p-2 border-b border-dark-100 dark:border-dark-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      placeholder="Rechercher ou saisir une ville..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-dark-50 dark:bg-dark-900 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Liste */}
                <div className="max-h-48 overflow-y-auto">
                  {/* Option pour saisie libre */}
                  {citySearch && !filteredCities.some(c => c.name.toLowerCase() === citySearch.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity(citySearch);
                        setShowCityDropdown(false);
                        setCitySearch('');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors text-primary-500"
                    >
                      <span className="text-sm">Utiliser "{citySearch}"</span>
                    </button>
                  )}
                  
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors',
                        selectedCity === city.name && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <div>
                        <span className="text-sm text-dark-900 dark:text-white">{city.name}</span>
                        {city.region && (
                          <span className="text-xs text-dark-400 ml-2">({city.region})</span>
                        )}
                      </div>
                      {selectedCity === city.name && (
                        <Check className="w-4 h-4 text-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Adresse détaillée */}
      {selectedCountry && selectedCity && (
        <div>
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
            Adresse complète {required && <span className="text-danger-500">*</span>}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Quartier, rue, repère..."
            disabled={disabled}
            rows={2}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white dark:bg-dark-800 text-dark-900 dark:text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none',
              'border-dark-200 dark:border-dark-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

// Fonction pour obtenir l'emoji du drapeau
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default AddressSelector;
