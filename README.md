# copilot-agent

Example Node.js application that connects to a Microsoft Copilot Studio agent using the Microsoft 365 Agent SDK. It authenticates with Azure AD using **msal-node**'s interactive authorization code flow and caches the refresh token so you don't need to sign in every time.

## Setup

1. Install dependencies
   ```sh
   npm install
   ```
2. Copy `.env.TEMPLATE` to `.env` and fill in the values from your Azure AD app registration and Copilot Studio agent.

   ```env
   environmentId=<ENVIRONMENT_ID>
   agentIdentifier=<SCHEMA_NAME>
   tenantId=<TENANT_ID>
   appClientId=<CLIENT_ID>
   ```

## Running

Start the app with:

```sh
npm start
```

A browser window will open for you to sign in. After authentication the app creates a session with the configured Copilot Studio agent, sends it the prompt `"Hello, what can you do?"` and prints the raw response to the terminal.

Tokens are cached to `~/.msal_cache.json` so subsequent runs will reuse the existing session until the refresh token expires.
