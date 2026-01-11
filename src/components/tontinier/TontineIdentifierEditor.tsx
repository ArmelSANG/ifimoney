'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button, Input, Modal, Badge } from '@/components/common';
import { tontineService } from '@/services/tontine';
import { TONTINE_IDENTIFIER_RULES, isValidTontineIdentifier } from '@/types';
import type { Tontine, IdentifierChange } from '@/types';
import { formatDateTime } from '@/utils';
import { 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  History, 
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';

interface TontineIdentifierEditorProps {
  tontine: Tontine;
  onUpdate: (newIdentifier: string) => void;
  userId: string;
  isCreating?: boolean; // Mode création vs édition
}

export function TontineIdentifierEditor({ 
  tontine, 
  onUpdate, 
  userId,
  isCreating = false 
}: TontineIdentifierEditorProps) {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [newIdentifier, setNewIdentifier] = useState(tontine.identifier);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Vérifier la disponibilité de l'identifiant
  const checkAvailability = async (identifier: string) => {
    if (identifier === tontine.identifier) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const result = await tontineService.checkIdentifierAvailability(identifier);
      setIsAvailable(result.available);
    } catch (error) {
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Valider et vérifier lors de la saisie
  useEffect(() => {
    const validation = isValidTontineIdentifier(newIdentifier);
    if (!validation.valid) {
      setValidationError(validation.error || null);
      setIsAvailable(null);
      return;
    }
    
    setValidationError(null);
    
    // Debounce la vérification de disponibilité
    const timer = setTimeout(() => {
      checkAvailability(newIdentifier);
    }, 500);

    return () => clearTimeout(timer);
  }, [newIdentifier, tontine.identifier]);

  const handleSubmit = async () => {
    if (!isAvailable && newIdentifier !== tontine.identifier) {
      toast.error('Cet identifiant n\'est pas disponible');
      return;
    }

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (newIdentifier === tontine.identifier) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await tontineService.updateTontine(
        tontine.id,
        { identifier: newIdentifier },
        userId
      );

      if (result.success) {
        toast.success('Identifiant modifié avec succès');
        onUpdate(newIdentifier);
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Erreur lors de la modification');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewIdentifier(tontine.identifier);
    setIsEditing(false);
    setValidationError(null);
    setIsAvailable(null);
  };

  const identifierHistory = (tontine.identifier_history as IdentifierChange[]) || [];

  return (
    <div className="space-y-4">
      {/* Affichage / Édition de l'identifiant */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1"
            >
              <div className="relative">
                <Input
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value.toUpperCase())}
                  placeholder="Ex: TONTINE-2025-001"
                  className="pr-10 font-mono text-lg"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking && (
                    <Loader2 className="w-5 h-5 text-dark-400 animate-spin" />
                  )}
                  {!isChecking && isAvailable === true && (
                    <CheckCircle2 className="w-5 h-5 text-success-500" />
                  )}
                  {!isChecking && isAvailable === false && (
                    <XCircle className="w-5 h-5 text-danger-500" />
                  )}
                </div>
              </div>

              {/* Messages de validation */}
              {validationError && (
                <p className="mt-1.5 text-sm text-danger-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </p>
              )}
              {!validationError && isAvailable === false && (
                <p className="mt-1.5 text-sm text-danger-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Cet identifiant est déjà utilisé
                </p>
              )}
              {!validationError && isAvailable === true && (
                <p className="mt-1.5 text-sm text-success-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Identifiant disponible
                </p>
              )}

              {/* Règles de format */}
              <div className="mt-2 p-3 rounded-lg bg-dark-50 dark:bg-dark-800">
                <p className="text-xs text-dark-500 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{TONTINE_IDENTIFIER_RULES.description}</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3"
            >
              <span className="font-mono text-xl font-bold text-dark-900 dark:text-white">
                {tontine.identifier}
              </span>
              <Badge variant="primary" size="sm">ID Tontine</Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={handleSubmit}
                disabled={isSubmitting || isChecking || !!validationError || isAvailable === false}
                isLoading={isSubmitting}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Valider
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
                leftIcon={<X className="w-4 h-4" />}
              >
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Modifier
              </Button>
              {identifierHistory.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory(true)}
                  leftIcon={<History className="w-4 h-4" />}
                >
                  Historique ({identifierHistory.length})
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Prévisualisation lors de la modification */}
      {isEditing && newIdentifier !== tontine.identifier && !validationError && isAvailable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
        >
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400 mb-2">
            Prévisualisation du changement
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-dark-500 line-through">{tontine.identifier}</span>
            <span className="text-dark-400">→</span>
            <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
              {newIdentifier}
            </span>
          </div>
          <p className="text-xs text-primary-600 dark:text-primary-500 mt-2">
            Ce changement sera enregistré dans l'historique
          </p>
        </motion.div>
      )}

      {/* Modal historique */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Historique des modifications"
        description="Liste de tous les changements d'identifiant de cette tontine"
        size="lg"
      >
        <div className="space-y-4">
          {identifierHistory.length === 0 ? (
            <p className="text-center text-dark-500 py-8">
              Aucune modification d'identifiant enregistrée
            </p>
          ) : (
            <div className="space-y-3">
              {identifierHistory.map((change, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-100 dark:border-dark-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-dark-500">
                      {formatDateTime(change.changed_at)}
                    </span>
                    <Badge variant="default" size="sm">
                      #{identifierHistory.length - index}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-dark-500">{change.old_identifier}</span>
                    <span className="text-dark-400">→</span>
                    <span className="font-mono font-bold text-dark-900 dark:text-white">
                      {change.new_identifier}
                    </span>
                  </div>
                  {change.changed_by_name && (
                    <p className="text-xs text-dark-500 mt-2">
                      Par : {change.changed_by_name}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default TontineIdentifierEditor;
