#!/usr/bin/env node
/**
 * Descarga las sugerencias nuevas del buzón (tabla `suggestions`) a feedback/sugerencias.md.
 *
 *   npm run sugerencias            → solo las nuevas desde la última lectura
 *   npm run sugerencias -- --todas → todas
 *
 * Necesita en .env.local (no se sube a git ni a EAS):
 *   SUPABASE_SECRET_KEY=...   Supabase → Project Settings → API Keys → secret (o la legacy service_role)
 * Solo lee. No guarda el user_id: lo cambia por un alias estable ("persona-3f2a").
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

for (const file of ['.env', '.env.local']) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Falta EXPO_PUBLIC_SUPABASE_URL en .env o SUPABASE_SECRET_KEY en .env.local.');
  process.exit(1);
}

const dir = 'feedback';
const output = join(dir, 'sugerencias.md');
const stampFile = join(dir, '.ultima-lectura');
const all = process.argv.includes('--todas');
const since = !all && existsSync(stampFile) ? readFileSync(stampFile, 'utf8').trim() : null;

const query = new URLSearchParams({ select: 'created_at,app_version,message,user_id', order: 'created_at.asc' });
if (since) query.set('created_at', `gt.${since}`);

// Las llaves nuevas (sb_secret_...) no son JWT: van solo en `apikey`. La legacy service_role también va como Bearer.
const headers = key.startsWith('sb_secret_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
const response = await fetch(`${url}/rest/v1/suggestions?${query}`, { headers });
if (!response.ok) {
  console.error(`Supabase respondió ${response.status}: ${await response.text()}`);
  process.exit(1);
}

/** @type {{ created_at: string; app_version: string | null; message: string; user_id: string | null }[]} */
const rows = await response.json();
const alias = userId => (userId ? `persona-${createHash('sha256').update(userId).digest('hex').slice(0, 4)}` : 'sin cuenta');

mkdirSync(dir, { recursive: true });
const header = since ? `# Sugerencias nuevas desde ${since}` : '# Todas las sugerencias';
const body = rows.length
  ? rows
      .map(row => {
        const date = row.created_at.slice(0, 16).replace('T', ' ');
        const quoted = row.message.trim().split('\n').map(line => `> ${line}`).join('\n');
        return `## ${date} · ${alias(row.user_id)} · ${row.app_version ?? 'versión desconocida'}\n\n${quoted}\n`;
      })
      .join('\n')
  : '_No hay sugerencias nuevas._\n';
writeFileSync(output, `${header}\n\nDescargado: ${new Date().toISOString()} · ${rows.length} sugerencia(s)\n\n${body}`);

if (rows.length) writeFileSync(stampFile, rows[rows.length - 1].created_at);
console.log(`${rows.length} sugerencia(s) en ${output}`);
