// ============================================
// FONCTION EDGE: SAUVEGARDE AUTOMATIQUE
// Exporte les données et envoie par email
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY'); // Optionnel, pour l'envoi d'email
const BACKUP_EMAIL = 'services.ifiaas@gmail.com';

interface BackupResult {
  success: boolean;
  tables: Record<string, number>;
  timestamp: string;
  size: number;
  error?: string;
}

serve(async (req) => {
  try {
    // Vérifier l'authentification (clé API ou cron secret)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    // Permettre les appels depuis le cron Supabase ou avec la clé service
    if (!authHeader && !cronSecret) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Démarrage de la sauvegarde...');
    
    // Créer le client Supabase avec la clé service
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Tables à sauvegarder
    const tables = [
      'users',
      'tontiniers',
      'clients',
      'registration_requests',
      'tontines',
      'tontine_participations',
      'transactions',
      'notifications',
      'conversations',
      'chat_messages',
      'cgu',
      'cgu_acceptances',
      'audit_logs',
      'tontinier_earnings',
      'tontinier_subscriptions',
      'reserved_fees',
    ];

    const backup: Record<string, any[]> = {};
    const counts: Record<string, number> = {};

    // Exporter chaque table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(100000); // Limite de sécurité

        if (error) {
          console.error(`Erreur table ${table}:`, error.message);
          backup[table] = [];
          counts[table] = 0;
        } else {
          backup[table] = data || [];
          counts[table] = data?.length || 0;
        }
      } catch (e) {
        console.error(`Exception table ${table}:`, e);
        backup[table] = [];
        counts[table] = 0;
      }
    }

    // Créer le fichier de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'ifimoney',
      tables: backup,
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSize = new Blob([backupJson]).size;

    console.log(`Backup créé: ${backupSize} bytes, ${Object.keys(counts).length} tables`);

    // Sauvegarder dans le bucket Storage
    const fileName = `backups/ifimoney_backup_${timestamp}.json`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, backupJson, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      console.error('Erreur upload:', uploadError);
    } else {
      console.log('Backup uploadé:', fileName);
    }

    // Générer l'URL de téléchargement
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Envoyer l'email si Resend est configuré
    let emailSent = false;
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ifiMoney <backup@ifimoney.com>',
            to: [BACKUP_EMAIL],
            subject: `[ifiMoney] Sauvegarde automatique - ${new Date().toLocaleDateString('fr-FR')}`,
            html: `
              <h2>Sauvegarde automatique ifiMoney</h2>
              <p>Une nouvelle sauvegarde a été créée avec succès.</p>
              
              <h3>Détails:</h3>
              <ul>
                <li><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</li>
                <li><strong>Taille:</strong> ${(backupSize / 1024).toFixed(2)} KB</li>
                <li><strong>Tables:</strong> ${Object.keys(counts).length}</li>
              </ul>
              
              <h3>Résumé par table:</h3>
              <table border="1" cellpadding="8" style="border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                  <th>Table</th>
                  <th>Enregistrements</th>
                </tr>
                ${Object.entries(counts)
                  .map(([table, count]) => `
                    <tr>
                      <td>${table}</td>
                      <td style="text-align: center;">${count}</td>
                    </tr>
                  `)
                  .join('')}
              </table>
              
              <p style="margin-top: 20px;">
                <a href="${urlData.publicUrl}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Télécharger la sauvegarde
                </a>
              </p>
              
              <hr style="margin-top: 30px;">
              <p style="color: #666; font-size: 12px;">
                Ce message a été envoyé automatiquement par le système de sauvegarde ifiMoney.
              </p>
            `,
          }),
        });

        emailSent = emailResponse.ok;
        if (!emailSent) {
          const errorText = await emailResponse.text();
          console.error('Erreur envoi email:', errorText);
        }
      } catch (e) {
        console.error('Exception envoi email:', e);
      }
    }

    // Nettoyer les anciennes sauvegardes (garder les 7 derniers jours)
    try {
      const { data: files } = await supabase.storage
        .from('documents')
        .list('backups', { limit: 1000 });

      if (files && files.length > 168) { // 7 jours * 24 heures
        const oldFiles = files
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(0, files.length - 168);

        for (const file of oldFiles) {
          await supabase.storage.from('documents').remove([`backups/${file.name}`]);
        }
        console.log(`${oldFiles.length} anciennes sauvegardes supprimées`);
      }
    } catch (e) {
      console.error('Erreur nettoyage:', e);
    }

    // Résultat
    const result: BackupResult = {
      success: true,
      tables: counts,
      timestamp: new Date().toISOString(),
      size: backupSize,
    };

    // Log dans audit_logs
    await supabase.from('audit_logs').insert({
      action: 'BACKUP_CREATED',
      entity_type: 'system',
      entity_id: fileName,
      new_value: { 
        size: backupSize, 
        tables: counts, 
        email_sent: emailSent,
        download_url: urlData.publicUrl,
      },
    });

    return new Response(
      JSON.stringify({
        ...result,
        email_sent: emailSent,
        download_url: urlData.publicUrl,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur backup:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur inconnue' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
