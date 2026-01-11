'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Input, Card } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { CircleDollarSign, Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string().min(1, 'L\'identifiant est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.identifier, data.password);

    if (result.success) {
      if (result.requiresCGU) {
        toast.info('Veuillez accepter les conditions d\'utilisation');
        router.push('/auth/cgu');
      } else {
        toast.success('Connexion réussie !');
      }
    } else {
      toast.error(result.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-500 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <Card className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <CircleDollarSign className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              Bienvenue !
            </h1>
            <p className="text-dark-500 mt-2">
              Connectez-vous à votre compte ifiMoney
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Identifiant"
              placeholder="Ex: C10245 ou T10001"
              leftIcon={<User className="w-5 h-5" />}
              error={errors.identifier?.message}
              {...register('identifier')}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-primary-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-100 dark:border-dark-700 text-center">
            <p className="text-sm text-dark-500">
              Vous n'avez pas de compte ?{' '}
              <Link
                href="/auth/register"
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Faire une demande
              </Link>
            </p>
          </div>
        </Card>

        {/* Help text */}
        <p className="text-center text-sm text-dark-500 mt-6">
          <strong>Format des identifiants :</strong>
          <br />
          Client : C + numéro (ex: C10245)
          <br />
          Tontinier : T + numéro (ex: T10001)
        </p>
      </motion.div>
    </div>
  );
}
