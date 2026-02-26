#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CONFIG = {
  renderApiBase: process.env.RENDER_API_BASE || 'https://api.render.com/v1',
  renderApiKey: process.env.RENDER_API_KEY || '',
  renderServiceId: process.env.RENDER_SERVICE_ID || '',
  renderServiceName: process.env.RENDER_SERVICE_NAME || '',
  renderBackendUrlOverride: process.env.RENDER_BACKEND_URL || '',
  frontendEnvFile: process.env.FRONTEND_ENV_FILE || 'unified-pwa/.env.production',
  frontendEnvKey: process.env.FRONTEND_ENV_KEY || 'VITE_API_URL',
  skipFrontendFileUpdate: String(process.env.SKIP_FRONTEND_FILE_UPDATE || 'false').toLowerCase() === 'true',
  backendHealthPath: process.env.BACKEND_HEALTH_PATH || '/health',
  netlifyAuthToken: process.env.NETLIFY_AUTH_TOKEN || '',
  netlifySiteId: process.env.NETLIFY_SITE_ID || '',
  netlifyBuildHookUrl: process.env.NETLIFY_BUILD_HOOK_URL || ''
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function normalizeUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function looksLikePublicUrl(value) {
  return /^https?:\/\/[^/\s?#]+/i.test(String(value || ''));
}

function findUrlCandidates(node, out = []) {
  if (typeof node === 'string' && looksLikePublicUrl(node)) {
    out.push(normalizeUrl(node));
    return out;
  }

  if (Array.isArray(node)) {
    for (const item of node) findUrlCandidates(item, out);
    return out;
  }

  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      findUrlCandidates(value, out);
    }
  }

  return out;
}

function pickBestBackendUrl(servicePayload) {
  const directCandidates = [
    servicePayload?.url,
    servicePayload?.service?.url,
    servicePayload?.serviceDetails?.url,
    servicePayload?.service?.serviceDetails?.url
  ]
    .map(normalizeUrl)
    .filter(looksLikePublicUrl);

  const recursiveCandidates = findUrlCandidates(servicePayload);
  const candidates = [...new Set([...directCandidates, ...recursiveCandidates])];

  if (!candidates.length) {
    return '';
  }

  const preferred = candidates.find((url) => /\.onrender\.com$/i.test(new URL(url).hostname));
  return preferred || candidates[0];
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

async function getRenderServicePayload() {
  if (CONFIG.renderBackendUrlOverride) {
    return { url: normalizeUrl(CONFIG.renderBackendUrlOverride) };
  }

  if (!CONFIG.renderApiKey) {
    throw new Error('Missing RENDER_API_KEY (or set RENDER_BACKEND_URL override).');
  }

  const headers = {
    Authorization: `Bearer ${CONFIG.renderApiKey}`,
    Accept: 'application/json'
  };

  if (CONFIG.renderServiceId) {
    return fetchJson(`${CONFIG.renderApiBase}/services/${CONFIG.renderServiceId}`, { headers });
  }

  if (!CONFIG.renderServiceName) {
    throw new Error('Set RENDER_SERVICE_ID or RENDER_SERVICE_NAME.');
  }

  const listPayload = await fetchJson(`${CONFIG.renderApiBase}/services?limit=100`, { headers });
  const list = Array.isArray(listPayload)
    ? listPayload
    : Array.isArray(listPayload?.services)
      ? listPayload.services
      : Array.isArray(listPayload?.data)
        ? listPayload.data
        : [];

  const service = list.find((item) =>
    String(item?.name || '').toLowerCase() === CONFIG.renderServiceName.toLowerCase()
  );

  if (!service) {
    throw new Error(`Render service "${CONFIG.renderServiceName}" not found.`);
  }

  return { service };
}

async function verifyBackendHealth(baseUrl) {
  const healthUrl = `${normalizeUrl(baseUrl)}${CONFIG.backendHealthPath.startsWith('/') ? '' : '/'}${CONFIG.backendHealthPath}`;

  try {
    const response = await fetch(healthUrl, { method: 'GET' });
    if (!response.ok) {
      log(`[warn] Health check returned HTTP ${response.status} at ${healthUrl}`);
      return;
    }
    log(`[ok] Health endpoint reachable: ${healthUrl}`);
  } catch (error) {
    log(`[warn] Could not reach health endpoint ${healthUrl}: ${error.message}`);
  }
}

function upsertEnvLine(filePath, key, value) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const exists = fs.existsSync(absolutePath);
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`^\\s*${escapedKey}\\s*=.*$`);

  const lines = exists
    ? fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/)
    : [];

  let replaced = false;
  const updated = lines.map((line) => {
    if (matcher.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!replaced) {
    if (updated.length && updated[updated.length - 1].trim() !== '') {
      updated.push('');
    }
    updated.push(`${key}=${value}`);
  }

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${updated.join('\n').replace(/\n+$/, '\n')}`, 'utf8');
  log(`[ok] Updated ${filePath}: ${key}`);
}

async function syncNetlifyEnvVar(value) {
  if (!CONFIG.netlifyAuthToken || !CONFIG.netlifySiteId) {
    log('[skip] NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID missing; skipped Netlify env sync.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${CONFIG.netlifyAuthToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  const site = await fetchJson(`https://api.netlify.com/api/v1/sites/${CONFIG.netlifySiteId}`, { headers });
  const accountId = site?.account_id || site?.account_slug;

  if (!accountId) {
    throw new Error('Could not resolve Netlify account_id from site details.');
  }

  const patchUrl = `https://api.netlify.com/api/v1/accounts/${accountId}/env/${encodeURIComponent(CONFIG.frontendEnvKey)}?site_id=${encodeURIComponent(CONFIG.netlifySiteId)}`;
  const patchBody = {
    context: 'production',
    value
  };

  const patchResponse = await fetch(patchUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patchBody)
  });

  if (patchResponse.ok) {
    log(`[ok] Updated Netlify env var ${CONFIG.frontendEnvKey} for site ${CONFIG.netlifySiteId}`);
  } else if (patchResponse.status === 404) {
    const createUrl = `https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${encodeURIComponent(CONFIG.netlifySiteId)}`;
    const createBody = [
      {
        key: CONFIG.frontendEnvKey,
        scopes: ['builds'],
        values: [{ context: 'production', value }]
      }
    ];

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody)
    });

    if (!createResponse.ok) {
      const body = await createResponse.text();
      throw new Error(`Failed to create Netlify env var: HTTP ${createResponse.status} ${body.slice(0, 500)}`);
    }

    log(`[ok] Created Netlify env var ${CONFIG.frontendEnvKey} for site ${CONFIG.netlifySiteId}`);
  } else {
    const body = await patchResponse.text();
    throw new Error(`Failed to update Netlify env var: HTTP ${patchResponse.status} ${body.slice(0, 500)}`);
  }

  if (CONFIG.netlifyBuildHookUrl) {
    const trigger = await fetch(CONFIG.netlifyBuildHookUrl, { method: 'POST' });
    if (!trigger.ok) {
      const body = await trigger.text();
      throw new Error(`Netlify build hook failed: HTTP ${trigger.status} ${body.slice(0, 500)}`);
    }
    log('[ok] Triggered Netlify build hook');
  } else {
    log('[info] NETLIFY_BUILD_HOOK_URL not set. Trigger a Netlify redeploy to apply env changes.');
  }
}

async function main() {
  const renderPayload = await getRenderServicePayload();
  const backendUrl = pickBestBackendUrl(renderPayload);

  if (!backendUrl) {
    throw new Error('Could not determine backend URL from Render payload. Set RENDER_BACKEND_URL as fallback.');
  }

  log(`[ok] Backend URL resolved: ${backendUrl}`);
  await verifyBackendHealth(backendUrl);

  if (!CONFIG.skipFrontendFileUpdate) {
    upsertEnvLine(CONFIG.frontendEnvFile, CONFIG.frontendEnvKey, backendUrl);
  } else {
    log('[skip] Local frontend env file update skipped.');
  }

  await syncNetlifyEnvVar(backendUrl);
  log('[done] Backend URL sync complete.');
}

main().catch((error) => fail(`[error] ${error.message}`));
