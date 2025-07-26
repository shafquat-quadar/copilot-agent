const fs = require('fs');
const path = require('path');
const { DeviceCodeCredential } = require('@azure/identity');
const { CopilotStudioClient, ConnectionSettings } = require('@microsoft/agents-copilotstudio-client');
const dotenv = require('dotenv');

dotenv.config();

const {
  appClientId,
  tenantId,
  environmentId,
  agentIdentifier
} = process.env;

if (!appClientId || !tenantId || !environmentId || !agentIdentifier) {
  throw new Error('Missing required environment variables');
}

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error('Usage: node index.js <input.json>');
}

const fileContent = fs.readFileSync(path.resolve(inputPath), 'utf8');
const input = JSON.parse(fileContent);

if (!input.prompt) {
  throw new Error('Input JSON must contain a prompt');
}

const credential = new DeviceCodeCredential({
  tenantId,
  clientId: appClientId,
  userPromptCallback: (info) => {
    console.error(info.message);
  }
});

const settings = new ConnectionSettings({
  environmentId,
  agentIdentifier,
  appClientId,
  tenantId
});

async function main() {
  const scope = CopilotStudioClient.scopeFromSettings(settings);
  const tokenResponse = await credential.getToken(scope);
  if (!tokenResponse || !tokenResponse.token) {
    throw new Error('Authentication failed');
  }

  const client = new CopilotStudioClient(settings, tokenResponse.token);

  let sessionId = input.sessionId;
  if (!sessionId) {
    const act = await client.startConversationAsync(true);
    sessionId = act.conversation && act.conversation.id;
    if (!sessionId) {
      throw new Error('Failed to obtain sessionId');
    }
  }

  const activities = await client.askQuestionAsync(input.prompt, sessionId);
  const replyActivity = activities.find(a => a.text);
  if (!replyActivity || !replyActivity.text) {
    throw new Error('Malformed response from agent');
  }

  const output = {
    reply: replyActivity.text,
    sessionId
  };

  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
