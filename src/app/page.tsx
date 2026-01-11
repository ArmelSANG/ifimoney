'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/common';
import { useTheme } from '@/contexts/ThemeContext';
import { ADMIN_CONTACT } from '@/types';
import {
  CircleDollarSign,
  Shield,
  Users,
  TrendingUp,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Sécurité Maximale',
    description: 'Vos données et transactions sont protégées par un chiffrement de niveau bancaire.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Gestion Simplifiée',
    description: 'Interface intuitive pour gérer vos tontines, clients et transactions en toute simplicité.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Traçabilité Totale',
    description: 'Historique complet de toutes les opérations pour une transparence absolue.',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Accessible Partout',
    description: 'Accédez à votre compte depuis n\'importe quel appareil, à tout moment.',
  },
];

const tontineTypes = [
  {
    name: 'Classique',
    description: 'Cotisation à montant fixe régulier',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Flexible',
    description: 'Cotisation à montant variable',
    color: 'from-green-500 to-green-600',
  },
  {
    name: 'À Terme',
    description: 'Épargne bloquée jusqu\'à échéance',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function HomePage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-100 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-dark-900 dark:text-white">
                ifiMoney
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-dark-500" />
                ) : (
                  <Moon className="w-5 h-5 text-dark-500" />
                )}
              </button>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:block">
                <Button size="sm">S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Nouvelle génération de tontine digitale
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-900 dark:text-white leading-tight"
            >
              La tontine réinventée pour{' '}
              <span className="gradient-text">l'Afrique moderne</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg lg:text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto"
            >
              Gérez vos tontines en toute sécurité avec notre plateforme digitale.
              Transparence, traçabilité et simplicité au service de votre épargne.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/register">
                <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Commencer maintenant
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="xl">
                  J'ai déjà un compte
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-dark-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-dark-900 dark:text-white">
              Pourquoi choisir ifiMoney ?
            </h2>
            <p className="mt-4 text-lg text-dark-600 dark:text-dark-400">
              Une plateforme conçue pour répondre aux besoins réels du terrain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tontine Types Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-dark-900 dark:text-white">
              Types de tontines disponibles
            </h2>
            <p className="mt-4 text-lg text-dark-600 dark:text-dark-400">
              Choisissez le type de tontine qui correspond à vos objectifs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tontineTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-800 shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${type.color}`} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
                    Tontine {type.name}
                  </h3>
                  <p className="text-dark-600 dark:text-dark-400">
                    {type.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                      Suivi en temps réel
                    </li>
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                      Historique complet
                    </li>
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                      Notifications automatiques
                    </li>
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Lock className="w-16 h-16 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Prêt à digitaliser vos tontines ?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Rejoignez les milliers d'utilisateurs qui font confiance à ifiMoney
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button
                size="xl"
                className="bg-white text-primary-600 hover:bg-dark-100"
              >
                Créer un compte gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-32 bg-dark-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-dark-900 dark:text-white mb-4">
            Besoin d'aide ?
          </h2>
          <p className="text-lg text-dark-600 dark:text-dark-400 mb-8">
            Notre équipe est disponible pour répondre à toutes vos questions
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={ADMIN_CONTACT.phone_link}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-success-500 text-white font-medium hover:bg-success-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {ADMIN_CONTACT.phone}
            </a>
            <a
              href={ADMIN_CONTACT.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BA5C] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-dark-100 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-dark-900 dark:text-white">
                ifiMoney
              </span>
            </div>
            <p className="text-sm text-dark-500">
              © {new Date().getFullYear()} {ADMIN_CONTACT.name}. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
