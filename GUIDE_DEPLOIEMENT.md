# 🚀 Guide de Déploiement Complet - ifiMoney

## Table des matières
1. [Prérequis](#1-prérequis)
2. [Configuration de Supabase (Base de données)](#2-configuration-de-supabase)
3. [Préparation du code](#3-préparation-du-code)
4. [Déploiement sur Vercel](#4-déploiement-sur-vercel)
5. [Configuration du domaine personnalisé](#5-configuration-du-domaine-personnalisé)
6. [Création du compte Admin](#6-création-du-compte-admin)
7. [Tests finaux](#7-tests-finaux)
8. [Maintenance et mises à jour](#8-maintenance-et-mises-à-jour)

---

## 1. Prérequis

### Ce dont vous avez besoin :
- ✅ Un ordinateur avec connexion Internet
- ✅ Un compte email (Gmail recommandé)
- ✅ Le fichier ZIP du projet (ifimoney.zip)

### Comptes à créer (tous gratuits) :
| Service | Utilité | Lien |
|---------|---------|------|
| **GitHub** | Héberger votre code | https://github.com |
| **Supabase** | Base de données | https://supabase.com |
| **Vercel** | Héberger le site web | https://vercel.com |

---

## 2. Configuration de Supabase

Supabase est votre base de données. C'est là que seront stockés tous les utilisateurs, tontines, transactions, etc.

### Étape 2.1 : Créer un compte Supabase

1. Allez sur **https://supabase.com**
2. Cliquez sur **"Start your project"** (bouton vert)
3. Cliquez sur **"Sign up with GitHub"** ou **"Sign up with email"**
4. Si vous utilisez email :
   - Entrez votre email
   - Créez un mot de passe fort
   - Vérifiez votre email (cliquez sur le lien reçu)

### Étape 2.2 : Créer un nouveau projet

1. Une fois connecté, cliquez sur **"New Project"**
2. Remplissez les informations :
   ```
   Organization: [votre nom ou entreprise]
   Project name: ifimoney
   Database Password: [créez un mot de passe FORT et NOTEZ-LE !]
   Region: West Europe (Frankfurt) - le plus proche du Bénin
   ```
3. Cliquez sur **"Create new project"**
4. ⏳ Attendez 2-3 minutes que le projet se crée

### Étape 2.3 : Récupérer les clés API

1. Dans votre projet Supabase, cliquez sur **"Settings"** (icône engrenage à gauche)
2. Cliquez sur **"API"** dans le menu
3. Vous verrez :
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. **COPIEZ ET GARDEZ CES 3 VALEURS** dans un fichier texte !

⚠️ **IMPORTANT** : Ne partagez JAMAIS la clé `service_role` publiquement !

### Étape 2.4 : Créer les tables de la base de données

1. Dans Supabase, cliquez sur **"SQL Editor"** (icône à gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql` de votre projet
4. **Copiez TOUT le contenu** et collez-le dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou Ctrl+Enter)
6. Vous devriez voir : "Success. No rows returned"

7. Répétez pour les autres fichiers dans l'ordre :
   - `002_rls_policies.sql`
   - `003_notifications.sql`

### Étape 2.5 : Configurer le stockage (pour les photos)

1. Cliquez sur **"Storage"** dans le menu à gauche
2. Cliquez sur **"Create a new bucket"**
3. Configurez :
   ```
   Name: documents
   Public bucket: ✅ Oui (coché)
   ```
4. Cliquez sur **"Create bucket"**

### Étape 2.6 : Configurer l'authentification

1. Cliquez sur **"Authentication"** dans le menu
2. Cliquez sur **"Providers"**
3. Vérifiez que **"Email"** est activé
4. Dans **"Email Templates"**, vous pouvez personnaliser les emails (optionnel)

✅ **Supabase est maintenant configuré !**

---

## 3. Préparation du code

### Étape 3.1 : Créer un compte GitHub

1. Allez sur **https://github.com**
2. Cliquez sur **"Sign up"**
3. Suivez les étapes (email, mot de passe, username)
4. Vérifiez votre email

### Étape 3.2 : Installer Git sur votre ordinateur

**Sur Windows :**
1. Téléchargez Git : https://git-scm.com/download/win
2. Exécutez l'installateur
3. Cliquez "Next" à chaque étape (paramètres par défaut)
4. Terminez l'installation

**Sur Mac :**
1. Ouvrez le Terminal
2. Tapez : `git --version`
3. Si Git n'est pas installé, une popup vous proposera de l'installer

### Étape 3.3 : Décompresser et préparer le projet

1. Créez un dossier `ifimoney` sur votre bureau
2. Décompressez le fichier `ifimoney.zip` dedans
3. Vous devriez avoir cette structure :
   ```
   Bureau/
   └── ifimoney/
       └── tontine-platform/
           ├── src/
           ├── public/
           ├── package.json
           └── ...
   ```

### Étape 3.4 : Configurer les variables d'environnement

1. Dans le dossier `tontine-platform`, trouvez le fichier `.env.example`
2. **Copiez-le** et renommez la copie en `.env.local`
3. Ouvrez `.env.local` avec un éditeur de texte (Notepad, TextEdit, VS Code)
4. Remplacez les valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=ifiMoney
   
   ADMIN_PHONE=+22901XXXXXXXX
   ADMIN_WHATSAPP=+229XXXXXXXX
   ```
5. Sauvegardez le fichier

### Étape 3.5 : Envoyer le code sur GitHub

1. Ouvrez un terminal (Invite de commandes sur Windows, Terminal sur Mac)
2. Naviguez vers le dossier du projet :
   ```bash
   cd Desktop/ifimoney/tontine-platform
   ```
3. Initialisez Git :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ifiMoney platform"
   ```

4. Créez un repository sur GitHub :
   - Allez sur https://github.com
   - Cliquez sur **"+"** en haut à droite → **"New repository"**
   - Nom : `ifimoney`
   - Laissez "Public" ou mettez "Private"
   - Ne cochez PAS "Add a README"
   - Cliquez **"Create repository"**

5. Connectez votre code local à GitHub :
   ```bash
   git remote add origin https://github.com/VOTRE_USERNAME/ifimoney.git
   git branch -M main
   git push -u origin main
   ```
   
   (Entrez vos identifiants GitHub si demandé)

✅ **Votre code est maintenant sur GitHub !**

---

## 4. Déploiement sur Vercel

Vercel va héberger votre site web et le rendre accessible au monde entier.

### Étape 4.1 : Créer un compte Vercel

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (plus simple !)
4. Autorisez Vercel à accéder à GitHub

### Étape 4.2 : Importer le projet

1. Sur le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Vous verrez la liste de vos repositories GitHub
3. Trouvez **"ifimoney"** et cliquez sur **"Import"**

### Étape 4.3 : Configurer le projet

1. Dans "Configure Project" :
   ```
   Project Name: ifimoney
   Framework Preset: Next.js (détecté automatiquement)
   Root Directory: tontine-platform (IMPORTANT !)
   ```

2. Cliquez sur **"Environment Variables"** pour ajouter vos clés :

   | NAME | VALUE |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGci... (la clé anon) |
   | `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... (la clé service_role) |
   | `NEXT_PUBLIC_APP_NAME` | ifiMoney |
   | `ADMIN_PHONE` | +22901XXXXXXXX |
   | `ADMIN_WHATSAPP` | +229XXXXXXXX |

   Pour chaque variable :
   - Entrez le nom dans "NAME"
   - Entrez la valeur dans "VALUE"
   - Cliquez sur "Add"

3. Cliquez sur **"Deploy"**

### Étape 4.4 : Attendre le déploiement

1. ⏳ Vercel va construire votre projet (2-5 minutes)
2. Vous verrez les logs en temps réel
3. Si tout va bien : **"Congratulations!"** 🎉
4. Vous recevrez une URL comme : `https://ifimoney-xxxxx.vercel.app`

### Étape 4.5 : Mettre à jour l'URL dans Supabase

1. Retournez sur **Supabase**
2. Allez dans **"Authentication"** → **"URL Configuration"**
3. Dans **"Site URL"**, mettez votre URL Vercel :
   ```
   https://ifimoney-xxxxx.vercel.app
   ```
4. Dans **"Redirect URLs"**, ajoutez :
   ```
   https://ifimoney-xxxxx.vercel.app/**
   ```
5. Cliquez sur **"Save"**

✅ **Votre site est en ligne !** 🎉

---

## 5. Configuration du domaine personnalisé

Vous voulez `www.ifimoney.com` au lieu de `ifimoney-xxxxx.vercel.app` ?

### Étape 5.1 : Acheter un domaine

Fournisseurs recommandés :
- **Namecheap** : https://namecheap.com (~$10/an)
- **Google Domains** : https://domains.google (~$12/an)
- **OVH** : https://ovh.com (moins cher en Afrique)

1. Cherchez un domaine disponible (ex: ifimoney.com, ifimoney.bj)
2. Achetez-le (paiement par carte ou PayPal)

### Étape 5.2 : Connecter le domaine à Vercel

1. Dans Vercel, allez dans votre projet **"ifimoney"**
2. Cliquez sur **"Settings"** → **"Domains"**
3. Entrez votre domaine : `ifimoney.com`
4. Cliquez sur **"Add"**

5. Vercel vous donnera des informations DNS à configurer :
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Étape 5.3 : Configurer les DNS chez votre registrar

1. Connectez-vous à votre fournisseur de domaine (Namecheap, OVH, etc.)
2. Trouvez la section **"DNS"** ou **"Manage DNS"**
3. Ajoutez les enregistrements fournis par Vercel
4. ⏳ Attendez 15 minutes à 48 heures pour la propagation

### Étape 5.4 : Activer HTTPS

1. Vercel active automatiquement HTTPS (SSL)
2. Votre site sera accessible en `https://ifimoney.com`

### Étape 5.5 : Mettre à jour Supabase avec le nouveau domaine

1. Retournez sur Supabase → Authentication → URL Configuration
2. Mettez à jour :
   ```
   Site URL: https://ifimoney.com
   Redirect URLs: https://ifimoney.com/**
   ```

---

## 6. Création du compte Admin

### Étape 6.1 : Créer l'utilisateur Admin dans Supabase

1. Dans Supabase, allez dans **"SQL Editor"**
2. Exécutez ce code (remplacez les valeurs) :

```sql
-- 1. Créer l'utilisateur dans auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@ifimoney.com',
  crypt('VotreMotDePasseAdmin123!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Administrateur IFIAAS"}',
  NOW(),
  NOW(),
  '',
  ''
) RETURNING id;
```

3. Notez l'`id` retourné (ex: `a1b2c3d4-e5f6-7890-...`)

4. Exécutez ce code avec l'ID obtenu :

```sql
-- 2. Créer le profil admin
INSERT INTO users (id, email, whatsapp, full_name, role, status, cgu_accepted)
VALUES (
  'COLLEZ_L_ID_ICI',
  'admin@ifimoney.com',
  '+22967455462',
  'Administrateur IFIAAS',
  'admin',
  'active',
  TRUE
);
```

### Étape 6.2 : Tester la connexion Admin

1. Allez sur votre site : `https://ifimoney.com/auth/login`
2. Connectez-vous avec :
   ```
   Email: admin@ifimoney.com
   Mot de passe: VotreMotDePasseAdmin123!
   ```
3. Vous devriez voir le dashboard Admin !

---

## 7. Tests finaux

### Checklist de vérification :

| Test | Comment vérifier | ✅ |
|------|------------------|---|
| Page d'accueil | Visitez votre URL | ☐ |
| Inscription | Créez un compte tontinier test | ☐ |
| Connexion | Connectez-vous avec le compte test | ☐ |
| CGU | Vérifiez que les CGU s'affichent | ☐ |
| Dashboard Admin | Connectez-vous en admin | ☐ |
| Mode sombre | Cliquez sur l'icône soleil/lune | ☐ |
| Mobile | Testez sur votre téléphone | ☐ |
| Notifications | Vérifiez la cloche dans la sidebar | ☐ |

### Si quelque chose ne marche pas :

1. **Erreur "Invalid API Key"** :
   - Vérifiez vos variables d'environnement sur Vercel
   - Redéployez le projet

2. **Page blanche** :
   - Vérifiez les logs sur Vercel (Settings → Functions → Logs)
   
3. **Erreur de connexion** :
   - Vérifiez que l'URL est bien configurée dans Supabase

---

## 8. Maintenance et mises à jour

### Pour mettre à jour le site :

1. Modifiez votre code localement
2. Envoyez sur GitHub :
   ```bash
   git add .
   git commit -m "Description des modifications"
   git push
   ```
3. Vercel redéploie automatiquement ! ✨

### Sauvegardes automatiques :

- **Code** : Sauvegardé sur GitHub
- **Base de données** : Supabase fait des backups quotidiens (plan gratuit = 7 jours)

### Surveillance :

1. **Vercel Analytics** : Voir le trafic (gratuit)
2. **Supabase Dashboard** : Voir l'utilisation de la base de données

---

## 📞 Besoin d'aide ?

Si vous êtes bloqué :
1. Relisez l'étape concernée
2. Vérifiez les messages d'erreur
3. Consultez la documentation :
   - Supabase : https://supabase.com/docs
   - Vercel : https://vercel.com/docs
   - Next.js : https://nextjs.org/docs

---

## 🎉 Félicitations !

Votre plateforme **ifiMoney** est maintenant en ligne et prête à être utilisée !

Récapitulatif de vos URLs :
- **Site web** : https://ifimoney.com (ou votre URL Vercel)
- **Base de données** : https://supabase.com/dashboard
- **Hébergement** : https://vercel.com/dashboard
- **Code source** : https://github.com/VOTRE_USERNAME/ifimoney

---

*Guide créé pour ifiMoney - IFIAAS © 2025*
