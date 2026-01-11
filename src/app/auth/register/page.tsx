'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Input, Select, Card } from '@/components/common';
import { registrationService } from '@/services/registration';
import { IDENTITY_DOC_TYPES, TONTINE_TYPES } from '@/utils';
import {
  CircleDollarSign,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Upload,
  FileText,
  Target,
  CheckCircle2,
  Users,
  Briefcase,
} from 'lucide-react';

const tontinierSchema = z.object({
  whatsapp: z.string().min(8, 'Numéro WhatsApp invalide'),
  full_name: z.string().min(2, 'Nom complet requis'),
  identity_doc_type: z.enum(['cni', 'passport', 'permis', 'carte_consulaire']),
});

const clientSchema = z.object({
  whatsapp: z.string().min(8, 'Numéro WhatsApp invalide'),
  full_name: z.string().min(2, 'Nom complet requis'),
  desired_tontine_type: z.enum(['classique', 'flexible', 'terme']).optional(),
  desired_mise: z.string().optional(),
  desired_objective: z.string().optional(),
});

type AccountType = 'tontinier' | 'client' | null;

type TontinierFormData = z.infer<typeof tontinierSchema>;
type ClientFormData = z.infer<typeof clientSchema>;

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [identityDoc, setIdentityDoc] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const tontinierForm = useForm<TontinierFormData>({
    resolver: zodResolver(tontinierSchema),
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5 Mo');
        return;
      }
      setProfilePhoto(file);
    }
  };

  const handleIdentityDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le document ne doit pas dépasser 10 Mo');
        return;
      }
      setIdentityDoc(file);
    }
  };

  const onSubmitTontinier = async (data: TontinierFormData) => {
    if (!profilePhoto) {
      toast.error('Veuillez ajouter une photo de profil');
      return;
    }
    if (!identityDoc) {
      toast.error('Veuillez ajouter une photo de votre pièce d\'identité');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registrationService.submitTontinierRequest({
        whatsapp: data.whatsapp,
        full_name: data.full_name,
        profile_photo: profilePhoto,
        identity_doc_type: data.identity_doc_type,
        identity_doc: identityDoc,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitClient = async (data: ClientFormData) => {
    if (!profilePhoto) {
      toast.error('Veuillez ajouter une photo de profil');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registrationService.submitClientRequest({
        whatsapp: data.whatsapp,
        full_name: data.full_name,
        profile_photo: profilePhoto,
        desired_tontine_type: data.desired_tontine_type as 'classique' | 'flexible' | 'terme' | undefined,
        desired_mise: data.desired_mise ? parseFloat(data.desired_mise) : undefined,
        desired_objective: data.desired_objective,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-dark-50 dark:bg-dark-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">
            Demande envoyée !
          </h1>
          <p className="text-dark-600 dark:text-dark-400 mb-8 max-w-md">
            Votre demande a été soumise avec succès. Un administrateur l'examinera
            et vous recevrez une notification une fois votre compte validé.
          </p>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative"
      >
        <Link
          href={accountType ? '#' : '/'}
          onClick={(e) => {
            if (accountType) {
              e.preventDefault();
              if (step > 1) {
                setStep(step - 1);
              } else {
                setAccountType(null);
              }
            }
          }}
          className="inline-flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-500 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {accountType ? 'Retour' : 'Retour à l\'accueil'}
        </Link>

        <Card className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <CircleDollarSign className="w-9 h-9 text-white" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Choose account type */}
            {!accountType && (
              <motion.div
                key="choose-type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                    Créer un compte
                  </h1>
                  <p className="text-dark-500 mt-2">
                    Choisissez votre type de compte
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setAccountType('tontinier')}
                    className="w-full p-6 rounded-xl border-2 border-dark-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                          Je suis Tontinier
                        </h3>
                        <p className="text-sm text-dark-500 mt-1">
                          Je gère des tontines et des clients
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                  </button>

                  <button
                    onClick={() => setAccountType('client')}
                    className="w-full p-6 rounded-xl border-2 border-dark-200 dark:border-dark-700 hover:border-secondary-500 dark:hover:border-secondary-500 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 dark:text-secondary-400 group-hover:bg-secondary-500 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                          Je suis Client
                        </h3>
                        <p className="text-sm text-dark-500 mt-1">
                          Je veux participer à des tontines
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-secondary-500 transition-colors" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Tontinier Form */}
            {accountType === 'tontinier' && (
              <motion.form
                key="tontinier-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={tontinierForm.handleSubmit(onSubmitTontinier)}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                    Devenir Tontinier
                  </h1>
                  <p className="text-dark-500 mt-2">
                    Remplissez le formulaire ci-dessous
                  </p>
                </div>

                <Input
                  label="Nom complet"
                  placeholder="Ex: Jean Dupont"
                  leftIcon={<User className="w-5 h-5" />}
                  error={tontinierForm.formState.errors.full_name?.message}
                  {...tontinierForm.register('full_name')}
                />

                <Input
                  label="Numéro WhatsApp"
                  placeholder="Ex: +22967455462"
                  leftIcon={<Phone className="w-5 h-5" />}
                  error={tontinierForm.formState.errors.whatsapp?.message}
                  {...tontinierForm.register('whatsapp')}
                />

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Photo de profil
                  </label>
                  <label className="flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    <Upload className="w-6 h-6 text-dark-400" />
                    <span className="text-dark-500">
                      {profilePhoto ? profilePhoto.name : 'Choisir une photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoChange}
                    />
                  </label>
                </div>

                <Select
                  label="Type de pièce d'identité"
                  placeholder="Sélectionner..."
                  options={Object.entries(IDENTITY_DOC_TYPES).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  error={tontinierForm.formState.errors.identity_doc_type?.message}
                  {...tontinierForm.register('identity_doc_type')}
                />

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Photo de la pièce d'identité
                  </label>
                  <label className="flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    <FileText className="w-6 h-6 text-dark-400" />
                    <span className="text-dark-500">
                      {identityDoc ? identityDoc.name : 'Choisir un fichier'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleIdentityDocChange}
                    />
                  </label>
                </div>

                <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                  Soumettre ma demande
                </Button>
              </motion.form>
            )}

            {/* Client Form */}
            {accountType === 'client' && (
              <motion.form
                key="client-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={clientForm.handleSubmit(onSubmitClient)}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                    Devenir Client
                  </h1>
                  <p className="text-dark-500 mt-2">
                    Remplissez le formulaire ci-dessous
                  </p>
                </div>

                <Input
                  label="Nom complet"
                  placeholder="Ex: Marie Kouassi"
                  leftIcon={<User className="w-5 h-5" />}
                  error={clientForm.formState.errors.full_name?.message}
                  {...clientForm.register('full_name')}
                />

                <Input
                  label="Numéro WhatsApp"
                  placeholder="Ex: +22967455462"
                  leftIcon={<Phone className="w-5 h-5" />}
                  error={clientForm.formState.errors.whatsapp?.message}
                  {...clientForm.register('whatsapp')}
                />

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Photo de profil
                  </label>
                  <label className="flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    <Upload className="w-6 h-6 text-dark-400" />
                    <span className="text-dark-500">
                      {profilePhoto ? profilePhoto.name : 'Choisir une photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoChange}
                    />
                  </label>
                </div>

                <Select
                  label="Type de tontine souhaitée (optionnel)"
                  placeholder="Sélectionner..."
                  options={Object.entries(TONTINE_TYPES).map(([value, { label }]) => ({
                    value,
                    label,
                  }))}
                  {...clientForm.register('desired_tontine_type')}
                />

                <Input
                  label="Mise souhaitée (optionnel)"
                  placeholder="Ex: 5000"
                  type="number"
                  leftIcon={<Target className="w-5 h-5" />}
                  helperText="Montant en XOF"
                  {...clientForm.register('desired_mise')}
                />

                <Input
                  label="Objectif d'épargne (optionnel)"
                  placeholder="Ex: Achat d'une moto"
                  {...clientForm.register('desired_objective')}
                />

                <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                  Soumettre ma demande
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-dark-100 dark:border-dark-700 text-center">
            <p className="text-sm text-dark-500">
              Vous avez déjà un compte ?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
