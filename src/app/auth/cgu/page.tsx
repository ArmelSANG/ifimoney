'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button, Card, Loading } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { CircleDollarSign, FileText, CheckCircle2, ScrollText } from 'lucide-react';

interface CGUData {
  id: string;
  version: string;
  content: string;
}

export default function CGUPage() {
  const [cgu, setCGU] = useState<CGUData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchCGU = async () => {
      try {
        const { data, error } = await supabase
          .from('cgu')
          .select('id, version, content')
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setCGU(data);
      } catch (error) {
        console.error('Error fetching CGU:', error);
        toast.error('Erreur lors du chargement des CGU');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCGU();
  }, []);

  useEffect(() => {
    if (user?.cgu_accepted) {
      router.push(getDashboardPath(user.role));
    }
  }, [user, router]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!user || !cgu) return;

    setIsAccepting(true);
    try {
      const result = await authService.acceptCGU(user.id, cgu.id, cgu.version);

      if (result.success) {
        toast.success('Conditions acceptées !');
        await refreshUser();
        router.push(getDashboardPath(user.role));
      } else {
        toast.error(result.error || 'Erreur lors de l\'acceptation');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement des conditions..." />;
  }

  if (!cgu) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-16 h-16 text-dark-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
            CGU non disponibles
          </h1>
          <p className="text-dark-500">
            Les conditions générales d'utilisation ne sont pas disponibles pour le moment.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative"
      >
        <Card className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <ScrollText className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-dark-500 mt-2">
              Version {cgu.version} - Veuillez lire et accepter pour continuer
            </p>
          </div>

          {/* CGU Content */}
          <div
            onScroll={handleScroll}
            className="h-80 overflow-y-auto border border-dark-200 dark:border-dark-700 rounded-xl p-4 mb-6 text-sm text-dark-700 dark:text-dark-300 leading-relaxed"
          >
            <div dangerouslySetInnerHTML={{ __html: cgu.content }} />
          </div>

          {/* Scroll indicator */}
          {!hasScrolledToBottom && (
            <p className="text-center text-sm text-warning-600 mb-4">
              ⬇️ Faites défiler jusqu'en bas pour activer le bouton
            </p>
          )}

          {/* Accept checkbox & button */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasScrolledToBottom}
                disabled
                className="mt-1 w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-600 dark:text-dark-400">
                J'ai lu et j'accepte les Conditions Générales d'Utilisation de ifiMoney
              </span>
            </label>

            <Button
              onClick={handleAccept}
              fullWidth
              size="lg"
              disabled={!hasScrolledToBottom}
              isLoading={isAccepting}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              Accepter et continuer
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'tontinier':
      return '/tontinier/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/';
  }
}
