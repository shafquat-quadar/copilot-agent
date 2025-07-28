require('dotenv').config();
const { PublicClientApplication } = require('@azure/msal-node');
const { FilePersistence, PersistenceCachePlugin } = require('@azure/msal-node-extensions');
const { CopilotStudioClient, ConnectionSettings } = require('@microsoft/copilotstudio-client');
const path = require('path');
const os = require('os');

const { environmentId, agentIdentifier, tenantId, appClientId } = process.env;

if (!environmentId || !agentIdentifier || !tenantId || !appClientId) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function createPublicClient() {
  const cachePath = path.join(os.homedir(), '.msal_cache.json');
  const persistence = await FilePersistence.create(cachePath);
  const cachePlugin = new PersistenceCachePlugin(persistence);

  return new PublicClientApplication({
    auth: {
      clientId: appClientId,
      authority: `https://login.microsoftonline.com/${tenantId}`
    },
    cache: {
      cachePlugin
    }
  });
}

async function acquireToken(pca, scopes) {
  const accounts = await pca.getTokenCache().getAllAccounts();
  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        account: accounts[0],
        scopes
      });
      if (result && result.accessToken) {
        return result.accessToken;
      }
    } catch (err) {
      // fall through to interactive login
    }
  }

  const result = await pca.acquireTokenInteractive({
    scopes,
    openBrowser: (url) => {
      const open = require('open');
      return open(url);
    }
  });
  if (!result || !result.accessToken) {
    throw new Error('Token acquisition failed');
  }
  return result.accessToken;
}

async function main() {
  const settings = new ConnectionSettings({
    environmentId,
    agentIdentifier,
    appClientId,
    tenantId
  });

  const scope = CopilotStudioClient.scopeFromSettings(settings);

  const pca = await createPublicClient();
  const token = await acquireToken(pca, [scope]);

  const client = new CopilotStudioClient(settings, token);

  let sessionId;
  try {
    const act = await client.startConversationAsync(true);
    sessionId = act.conversation && act.conversation.id;
  } catch (err) {
    throw new Error('Failed to create session');
  }
  if (!sessionId) {
    throw new Error('No session ID returned');
  }

  let activities;
  try {
    activities = await client.askQuestionAsync('Hello, what can you do?', sessionId);
  } catch (err) {
    throw new Error('Agent communication failed');
  }
  const reply = activities.find(a => a.text);
  if (!reply) {
    throw new Error('Malformed agent response');
  }

  console.log(reply.text);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
