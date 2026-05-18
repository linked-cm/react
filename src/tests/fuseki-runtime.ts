import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  isFusekiAvailable,
  FUSEKI_BASE_URL,
} from '@_linked/core/test-helpers/fuseki-test-store';

let startedByUs = false;

function getComposeFile(): string | null {
  const composeFile = resolve(__dirname, 'docker-compose.test.yml');
  return existsSync(composeFile) ? composeFile : null;
}

export {FUSEKI_BASE_URL};

export async function ensureFuseki(): Promise<boolean> {
  if (await isFusekiAvailable()) return true;

  const composeFile = getComposeFile();
  if (!composeFile) {
    console.warn(
      '[react tests] docker-compose.test.yml not found — cannot auto-start Fuseki',
    );
    return false;
  }

  try {
    execSync('docker compose version', {stdio: 'ignore'});
  } catch {
    console.warn('[react tests] Docker Compose not available — skipping');
    return false;
  }

  console.log('[react tests] Fuseki not running — starting via Docker...');
  try {
    execSync(`docker compose -f "${composeFile}" up -d --wait`, {
      stdio: 'inherit',
      timeout: 60_000,
    });
    startedByUs = true;

    if (await isFusekiAvailable()) {
      console.log('[react tests] Fuseki is ready');
      return true;
    }

    console.warn('[react tests] Fuseki started but not responding');
    return false;
  } catch (err) {
    console.warn('[react tests] Failed to start Fuseki:', (err as Error).message);
    return false;
  }
}

export async function stopFuseki(): Promise<void> {
  if (!startedByUs) return;

  const composeFile = getComposeFile();
  if (!composeFile) return;

  try {
    execSync(`docker compose -f "${composeFile}" down`, {
      stdio: 'inherit',
      timeout: 30_000,
    });
  } catch {
    // Best effort cleanup.
  }

  startedByUs = false;
}
