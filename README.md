# copilot-agent

A simple script to call a Copilot Studio agent from Node.js using device code authentication.

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file with the following variables:
   ```env
   environmentId=<environment id of the CopilotStudio app>
   agentIdentifier=<schema name of the copilot>
   tenantId=<azure tenant id>
   appClientId=<application client id>
   ```

## Usage

Prepare an input JSON file with a `prompt` and optional `sessionId`:

```json
{
  "prompt": "Hello",
  "sessionId": "<optional>"
}
```

Run the script:

```sh
node index.js input.json
```

The script prints a JSON response containing the reply text and session ID.
