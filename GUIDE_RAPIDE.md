# ⚡ Guide Rapide de Déploiement - ifiMoney

## Résumé en 6 étapes

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   📦 ZIP ──→ 🐙 GitHub ──→ 🔷 Vercel ──→ 🌐 EN LIGNE !     │
│                  ↓                                          │
│              📊 Supabase (Base de données)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Étape 1️⃣ : Supabase (10 min)

```
1. Allez sur supabase.com → Sign Up
2. New Project → Nom: "ifimoney" → Create
3. Copiez ces 3 valeurs (Settings → API) :
   • Project URL
   • anon key  
   • service_role key
4. SQL Editor → Collez les 3 fichiers .sql → Run
```

**Clés à copier :**
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
SUPABASE_SERVICE_ROLE_KEY = eyJhbG...
```

---

## Étape 2️⃣ : GitHub (5 min)

```
1. Créez un compte sur github.com
2. Cliquez "+" → New repository → Nom: "ifimoney"
3. Téléchargez GitHub Desktop (plus facile) :
   → desktop.github.com
4. Décompressez le ZIP du projet
5. Glissez le dossier dans GitHub Desktop
6. Cliquez "Publish repository"
```

---

## Étape 3️⃣ : Vercel (5 min)

```
1. Allez sur vercel.com → Sign Up with GitHub
2. Add New Project → Import "ifimoney"
3. Root Directory: tontine-platform
4. Environment Variables: ajoutez vos 3 clés Supabase
5. Deploy !
```

**Variables à ajouter :**
| Nom | Valeur |
|-----|--------|
| NEXT_PUBLIC_SUPABASE_URL | https://xxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbG... |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbG... |
| NEXT_PUBLIC_APP_NAME | ifiMoney |

---

## Étape 4️⃣ : Configurer Supabase (2 min)

```
Supabase → Authentication → URL Configuration

Site URL: https://ifimoney-xxx.vercel.app
Redirect URLs: https://ifimoney-xxx.vercel.app/**
```

---

## Étape 5️⃣ : Créer l'Admin (3 min)

Dans Supabase → SQL Editor, exécutez :

```sql
-- Remplacez les valeurs !
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@ifimoney.com',
  crypt('MotDePasseSecurise123!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin IFIAAS"}',
  NOW(),
  NOW()
) RETURNING id;

-- Utilisez l'ID retourné ci-dessous
INSERT INTO users (id, email, whatsapp, full_name, role, status, cgu_accepted)
VALUES (
  'ID_RETOURNE_ICI',
  'admin@ifimoney.com',
  '+22967455462',
  'Admin IFIAAS',
  'admin',
  'active',
  TRUE
);
```

---

## Étape 6️⃣ : Tester ! 🎉

```
1. Ouvrez votre URL Vercel
2. Cliquez "Connexion"
3. Email: admin@ifimoney.com
4. Mot de passe: MotDePasseSecurise123!
```

---

## ❌ Problèmes courants

| Erreur | Solution |
|--------|----------|
| "Invalid API Key" | Vérifiez les variables Vercel |
| Page blanche | Vérifiez Root Directory = tontine-platform |
| "User not found" | Recréez l'admin dans Supabase |
| Erreur SQL | Exécutez les fichiers .sql dans l'ordre |

---

## 📱 Domaine personnalisé (optionnel)

1. Achetez un domaine (namecheap.com, ~$10/an)
2. Vercel → Settings → Domains → Add
3. Configurez les DNS selon les instructions
4. Mettez à jour l'URL dans Supabase

---

## ✅ Checklist finale

- [ ] Supabase créé avec les 3 fichiers SQL
- [ ] GitHub repository avec le code
- [ ] Vercel déployé avec les variables
- [ ] URL configurée dans Supabase
- [ ] Admin créé et fonctionnel
- [ ] Site accessible sur mobile

---

**🎊 Bravo ! Votre ifiMoney est en ligne !**

*Temps total estimé : 25-30 minutes*
