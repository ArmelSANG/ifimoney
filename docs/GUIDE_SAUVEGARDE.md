# Guide de Configuration - Sauvegarde Automatique ifiMoney

## 📋 Vue d'ensemble

Ce guide explique comment configurer la sauvegarde automatique de la base de données ifiMoney avec envoi par email.

## 🔧 Étape 1: Déployer la fonction Edge

### Via CLI Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref yntlaottqtshwitxbkne

# Déployer la fonction
supabase functions deploy backup
```

### Via Dashboard Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **Edge Functions**
4. Cliquer sur **Create a new function**
5. Nommer la fonction `backup`
6. Coller le contenu de `supabase/functions/backup/index.ts`
7. Cliquer sur **Deploy**

## 📧 Étape 2: Configurer l'envoi d'email (Resend)

Pour recevoir les sauvegardes par email, vous devez configurer Resend:

### Créer un compte Resend

1. Aller sur https://resend.com
2. Créer un compte gratuit
3. Vérifier votre domaine email (ou utiliser le domaine de test)
4. Récupérer votre **API Key**

### Ajouter la variable d'environnement

Dans Supabase Dashboard:

1. Aller dans **Settings** → **Edge Functions**
2. Dans **Secrets**, ajouter:
   - Nom: `RESEND_API_KEY`
   - Valeur: votre clé API Resend

## ⏰ Étape 3: Configurer le Cron (exécution automatique)

### Option A: Utiliser pg_cron (Supabase)

Dans **SQL Editor**, exécuter:

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le job de sauvegarde toutes les heures
SELECT cron.schedule(
  'backup-hourly',
  '0 * * * *', -- Toutes les heures à :00
  $$
  SELECT net.http_post(
    url := 'https://yntlaottqtshwitxbkne.supabase.co/functions/v1/backup',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Vérifier les jobs planifiés
SELECT * FROM cron.job;
```

### Option B: Utiliser un service externe (gratuit)

Utiliser https://cron-job.org :

1. Créer un compte gratuit
2. Créer un nouveau cron job:
   - **URL**: `https://yntlaottqtshwitxbkne.supabase.co/functions/v1/backup`
   - **Méthode**: POST
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Schedule**: `0 * * * *` (toutes les heures)

### Option C: Utiliser GitHub Actions (gratuit)

Créer `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 * * * *' # Toutes les heures
  workflow_dispatch: # Permet l'exécution manuelle

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger backup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://yntlaottqtshwitxbkne.supabase.co/functions/v1/backup
```

Ajouter le secret `SUPABASE_SERVICE_ROLE_KEY` dans les settings du repo GitHub.

## ✅ Étape 4: Tester la sauvegarde

### Test manuel

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://yntlaottqtshwitxbkne.supabase.co/functions/v1/backup
```

### Réponse attendue

```json
{
  "success": true,
  "tables": {
    "users": 10,
    "tontiniers": 5,
    "clients": 20,
    "tontines": 8,
    "transactions": 150,
    ...
  },
  "timestamp": "2025-01-12T14:00:00.000Z",
  "size": 125430,
  "email_sent": true,
  "download_url": "https://..."
}
```

## 📂 Où sont stockées les sauvegardes?

Les sauvegardes sont stockées dans:
- **Supabase Storage**: bucket `documents`, dossier `backups/`
- **Format**: JSON compressé
- **Nommage**: `ifimoney_backup_YYYY-MM-DDTHH-MM-SS.json`
- **Rétention**: 7 derniers jours (168 fichiers max)

## 🔍 Surveillance

### Voir les logs

Dans Supabase Dashboard:
1. Aller dans **Edge Functions**
2. Cliquer sur la fonction `backup`
3. Onglet **Logs**

### Voir l'historique des sauvegardes

```sql
SELECT * FROM audit_logs 
WHERE action = 'BACKUP_CREATED' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔄 Restauration

Pour restaurer une sauvegarde:

1. Télécharger le fichier JSON depuis Storage ou l'email
2. Dans SQL Editor, utiliser les données JSON pour recréer les enregistrements
3. Ou contacter le support Supabase pour une restauration complète

## 📞 Support

En cas de problème:
- Email: services.ifiaas@gmail.com
- WhatsApp: +229 67 45 54 62
