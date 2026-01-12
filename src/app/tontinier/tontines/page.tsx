'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout';
import { 
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Select, Modal, Badge, Loading,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/common';
import { TontineIdentifierEditor } from '@/components/tontinier/TontineIdentifierEditor';
import { useAuth } from '@/contexts/AuthContext';
import { tontineService } from '@/services/tontine';
import { formatCurrency, formatDate, TONTINE_TYPES, TONTINE_STATUSES } from '@/utils';
import { TONTINE_IDENTIFIER_RULES, isValidTontineIdentifier } from '@/types';
import type { Tontine, TontineType } from '@/types';
import { 
  Plus, Wallet, Search, Eye, Edit3, Users, 
  Calendar, CircleDollarSign, Clock, Info,
  CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

import { TONTINE_CONFIG } from '@/types/features';

const tontineSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  description: z.string().optional(),
  type: z.enum(['classique', 'flexible', 'terme']),
  mise: z.string().min(1, 'Mise requise').refine(
    (val) => parseFloat(val) >= TONTINE_CONFIG.MIN_MISE,
    `Le montant minimum est de ${TONTINE_CONFIG.MIN_MISE} F`
  ),
  cycle_days: z.string().min(1, 'Périodicité requise'),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().optional(),
  duration_months: z.string().optional(), // Durée en mois pour tontine à terme
  identifier: z.string().optional(),
});

type TontineFormData = z.infer<typeof tontineSchema>;

export default function TontinierTontinesPage() {
  const { user } = useAuth();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pour la validation de l'identifiant à la création
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [isCheckingIdentifier, setIsCheckingIdentifier] = useState(false);
  const [identifierAvailable, setIdentifierAvailable] = useState<boolean | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  const form = useForm<TontineFormData>({
    resolver: zodResolver(tontineSchema),
    defaultValues: {
      type: 'classique',
      cycle_days: '30',
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    fetchTontines();
  }, [user]);

  // Vérification de l'identifiant personnalisé
  useEffect(() => {
    if (!customIdentifier) {
      setIdentifierAvailable(null);
      setIdentifierError(null);
      return;
    }

    const validation = isValidTontineIdentifier(customIdentifier);
    if (!validation.valid) {
      setIdentifierError(validation.error || null);
      setIdentifierAvailable(null);
      return;
    }

    setIdentifierError(null);

    const timer = setTimeout(async () => {
      setIsCheckingIdentifier(true);
      const result = await tontineService.checkIdentifierAvailability(customIdentifier);
      setIdentifierAvailable(result.available);
      setIsCheckingIdentifier(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [customIdentifier]);

  const fetchTontines = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const result = await tontineService.getTontinierTontines(
      user.id,
      { page: 1, per_page: 100 }
    );
    
    if (result.success && result.data) {
      setTontines(result.data.data);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: TontineFormData) => {
    if (!user) return;

    // Vérifier l'identifiant personnalisé si fourni
    if (customIdentifier) {
      if (identifierError || identifierAvailable === false) {
        toast.error('Identifiant invalide ou non disponible');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await tontineService.createTontine(
        {
          name: data.name,
          description: data.description,
          type: data.type as TontineType,
          mise: parseFloat(data.mise),
          cycle_days: parseInt(data.cycle_days),
          start_date: data.start_date,
          end_date: data.type === 'terme' ? data.end_date : undefined,
          duration_months: data.type === 'terme' && data.duration_months ? parseInt(data.duration_months) : undefined,
          identifier: customIdentifier || undefined,
        },
        user.id
      );

      if (result.success) {
        toast.success('Tontine créée avec succès !');
        setShowCreateModal(false);
        form.reset();
        setCustomIdentifier('');
        fetchTontines();
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (tontine: Tontine) => {
    setSelectedTontine(tontine);
    setShowDetailModal(true);
  };

  const handleIdentifierUpdate = (newIdentifier: string) => {
    if (selectedTontine) {
      setSelectedTontine({ ...selectedTontine, identifier: newIdentifier });
      fetchTontines();
    }
  };

  const filteredTontines = tontines.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <DashboardLayout requiredRole="tontinier"><Loading text="Chargement..." /></DashboardLayout>;
  }

  return (
    <DashboardLayout requiredRole="tontinier">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Mes Tontines</h1>
          <p className="page-description">Créez et gérez vos tontines</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Nouvelle tontine
        </Button>
      </div>

      {/* Recherche */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou identifiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
        </div>
      </Card>

      {/* Liste des tontines */}
      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifiant</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Mise</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTontines.length === 0 ? (
              <TableEmpty
                icon={<Wallet className="w-12 h-12" />}
                title="Aucune tontine"
                description="Créez votre première tontine pour commencer"
                action={
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    Créer une tontine
                  </Button>
                }
              />
            ) : (
              filteredTontines.map((tontine, index) => (
                <motion.tr
                  key={tontine.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-dark-100 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800/50"
                >
                  <TableCell>
                    <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                      {tontine.identifier}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{tontine.name}</TableCell>
                  <TableCell>
                    <Badge variant={tontine.type === 'classique' ? 'primary' : tontine.type === 'flexible' ? 'success' : 'secondary'}>
                      {TONTINE_TYPES[tontine.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(tontine.mise)}</TableCell>
                  <TableCell>
                    <Badge variant={tontine.status === 'active' ? 'success' : 'default'}>
                      {TONTINE_STATUSES[tontine.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(tontine)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Détails
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          form.reset();
          setCustomIdentifier('');
        }}
        title="Nouvelle Tontine"
        size="lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nom de la tontine"
            placeholder="Ex: Tontine Épargne 2025"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <Input
            label="Description (optionnel)"
            placeholder="Description de la tontine..."
            {...form.register('description')}
          />

          <Select
            label="Type de tontine"
            options={Object.entries(TONTINE_TYPES).map(([value, { label }]) => ({ value, label }))}
            error={form.formState.errors.type?.message}
            {...form.register('type')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mise (XOF)"
              type="number"
              placeholder="5000"
              leftIcon={<CircleDollarSign className="w-5 h-5" />}
              error={form.formState.errors.mise?.message}
              {...form.register('mise')}
            />
            <Input
              label="Périodicité (jours)"
              type="number"
              placeholder="30"
              leftIcon={<Clock className="w-5 h-5" />}
              error={form.formState.errors.cycle_days?.message}
              {...form.register('cycle_days')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              leftIcon={<Calendar className="w-5 h-5" />}
              error={form.formState.errors.start_date?.message}
              {...form.register('start_date')}
            />
            {watchType === 'terme' && (
              <Input
                label="Date de fin"
                type="date"
                leftIcon={<Calendar className="w-5 h-5" />}
                error={form.formState.errors.end_date?.message}
                {...form.register('end_date')}
              />
            )}
          </div>

          {watchType === 'terme' && (
            <Input
              label="Durée du contrat (mois)"
              type="number"
              placeholder="Ex: 6"
              leftIcon={<Clock className="w-5 h-5" />}
              helperText="Aucun retrait possible avant cette durée"
              {...form.register('duration_months')}
            />
          )}

          {/* Identifiant personnalisé */}
          <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-dark-700 dark:text-dark-300">
                Identifiant personnalisé (optionnel)
              </span>
            </div>
            <p className="text-sm text-dark-500">
              Laissez vide pour générer automatiquement, ou entrez votre propre identifiant.
            </p>
            <div className="relative">
              <Input
                placeholder="Ex: TONTINE-EPARGNE-2025"
                value={customIdentifier}
                onChange={(e) => setCustomIdentifier(e.target.value.toUpperCase())}
                className="pr-10 font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingIdentifier && <Loader2 className="w-5 h-5 text-dark-400 animate-spin" />}
                {!isCheckingIdentifier && identifierAvailable === true && <CheckCircle2 className="w-5 h-5 text-success-500" />}
                {!isCheckingIdentifier && identifierAvailable === false && <XCircle className="w-5 h-5 text-danger-500" />}
              </div>
            </div>
            {identifierError && (
              <p className="text-sm text-danger-500">{identifierError}</p>
            )}
            {!identifierError && identifierAvailable === false && (
              <p className="text-sm text-danger-500">Cet identifiant est déjà utilisé</p>
            )}
            {!identifierError && identifierAvailable === true && (
              <p className="text-sm text-success-500">Identifiant disponible ✓</p>
            )}
            <p className="text-xs text-dark-400">{TONTINE_IDENTIFIER_RULES.description}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Créer la tontine
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la tontine"
        size="lg"
      >
        {selectedTontine && user && (
          <div className="space-y-6">
            {/* Éditeur d'identifiant */}
            <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
              <p className="text-sm font-medium text-dark-500 mb-3">Identifiant de la tontine</p>
              <TontineIdentifierEditor
                tontine={selectedTontine}
                onUpdate={handleIdentifierUpdate}
                userId={user.id}
              />
            </div>

            {/* Infos générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-dark-500">Nom</p>
                <p className="font-medium text-dark-900 dark:text-white">{selectedTontine.name}</p>
              </div>
              <div>
                <p className="text-sm text-dark-500">Type</p>
                <Badge variant={selectedTontine.type === 'classique' ? 'primary' : selectedTontine.type === 'flexible' ? 'success' : 'secondary'}>
                  {TONTINE_TYPES[selectedTontine.type].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-dark-500">Mise</p>
                <p className="font-bold text-primary-600">{formatCurrency(selectedTontine.mise)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-500">Périodicité</p>
                <p className="font-medium">{selectedTontine.cycle_days} jours</p>
              </div>
              <div>
                <p className="text-sm text-dark-500">Date de début</p>
                <p className="font-medium">{formatDate(selectedTontine.start_date)}</p>
              </div>
              {selectedTontine.end_date && (
                <div>
                  <p className="text-sm text-dark-500">Date de fin</p>
                  <p className="font-medium">{formatDate(selectedTontine.end_date)}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
              <div className="text-center">
                <p className="text-sm text-dark-500">Total collecté</p>
                <p className="text-2xl font-bold text-success-600">{formatCurrency(selectedTontine.total_collected)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-dark-500">Total retiré</p>
                <p className="text-2xl font-bold text-warning-600">{formatCurrency(selectedTontine.total_withdrawn)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth leftIcon={<Users className="w-5 h-5" />}>
                Voir les participants
              </Button>
              <Button variant="outline" fullWidth leftIcon={<Edit3 className="w-5 h-5" />}>
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
