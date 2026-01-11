# ifiMoney - Plateforme de Tontine Digitale

![ifiMoney](https://img.shields.io/badge/ifiMoney-v1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-green)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)

## 📋 Description

**ifiMoney** est une plateforme de gestion de tontine moderne, sécurisée et fiable, conçue spécifiquement pour les réalités terrain africaines. Elle permet de créer, gérer et suivre des tontines de manière transparente et traçable.

## ✨ Fonctionnalités

### Rôles Utilisateurs
- **Administrateur** : Gestion complète de la plateforme
- **Tontinier** : Gestion des tontines et des clients
- **Client** : Participation aux tontines multiples

### Types de Tontines
- **Classique** : Cotisation à montant fixe
- **Flexible** : Cotisation à montant variable
- **À Terme** : Épargne bloquée jusqu'à échéance

### 🆕 Gestion Avancée des Identifiants de Tontine
- ✅ **Format flexible** : Lettres, chiffres, tirets et underscores (3-20 caractères)
- ✅ **Modification à la création** : Le tontinier peut personnaliser l'identifiant
- ✅ **Modification après création** : Possibilité de changer l'identifiant à tout moment
- ✅ **Vérification en temps réel** : Validation et disponibilité vérifiées instantanément
- ✅ **Historique complet** : Toutes les modifications sont journalisées avec date et auteur
- ✅ **Interface dédiée** : Composant visuel pour modifier avec prévisualisation

### Fonctionnalités Clés
- Système d'identifiants uniques (CXXXX pour clients, TXXXX pour tontiniers)
- Un client peut participer à plusieurs tontines simultanément
- Gestion des dépôts (espèces et mobile money)
- Gestion des retraits avec validation
- Recherche avancée multicritères
- Tableau de bord avec statistiques
- Mode clair/sombre
- Design responsive

## 🛠 Technologies

- **Frontend** : Next.js 14, React 18, TypeScript
- **Styling** : Tailwind CSS, Framer Motion
- **Backend** : Supabase (Database, Auth, Storage, RLS)
- **Formulaires** : React Hook Form, Zod
- **UI** : Lucide React, Recharts

## 📦 Installation

### Prérequis
- Node.js >= 18.17.0
- npm ou yarn
- Compte Supabase

### Étapes

1. **Cloner le projet**
```bash
git clone <repository-url>
cd tontine-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**

Créez un projet Supabase et exécutez les migrations :
```sql
-- Dans l'éditeur SQL de Supabase, exécutez :
-- supabase/migrations/001_initial_schema.sql
-- supabase/migrations/002_rls_policies.sql
```

4. **Variables d'environnement**

Copiez `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```

Remplissez les variables :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

## 📁 Structure du Projet

```
tontine-platform/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── admin/              # Pages administrateur
│   │   ├── auth/               # Pages d'authentification
│   │   ├── client/             # Pages client
│   │   └── tontinier/          # Pages tontinier
│   ├── components/
│   │   ├── common/             # Composants réutilisables
│   │   ├── layout/             # Composants de mise en page
│   │   └── tontinier/          # Composants spécifiques tontinier
│   ├── contexts/               # Contextes React (Auth, Theme)
│   ├── services/               # Services API (Supabase)
│   ├── types/                  # Types TypeScript
│   ├── utils/                  # Utilitaires
│   └── styles/                 # Styles globaux
├── supabase/
│   └── migrations/             # Migrations SQL
└── ...
```

## 🔐 Sécurité

- Authentification JWT via Supabase Auth
- Row Level Security (RLS) pour la protection des données
- Chiffrement des données sensibles
- Logs et audit de toutes les opérations
- Validation des entrées côté client et serveur

## 🎨 Design

- Palette de couleurs : Bleu et Violet
- Mode clair et sombre
- Design responsive (mobile-first)
- Animations fluides avec Framer Motion
- Interface intuitive et accessible

## 📞 Contact Administrateur

- **Nom** : IFIAAS
- **Téléphone** : +2290167455462
- **WhatsApp** : +22967455462

## 🚀 Déploiement

Compatible avec **Vercel** (recommandé) et **Netlify**.

```bash
npm run build
npm start
```

## 📄 Licence

Propriétaire - IFIAAS © 2025

---

Développé avec ❤️ par IFIAAS pour l'Afrique
