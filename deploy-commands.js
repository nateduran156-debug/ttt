'use strict';

try { require('dotenv').config(); } catch {} // optional: only needed for local .env files

const { REST, Routes } = require('discord.js');
const fs               = require('fs');
const path             = require('path');

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

const commands = [];
const files    = walkDir(path.join(__dirname, 'commands'));

for (const file of files) {
  try {
    const cmd = require(file);
    if (cmd.data?.toJSON) commands.push(cmd.data.toJSON());
  } catch (e) {
    console.warn(`[Deploy] Skipped ${path.basename(file)}: ${e.message}`);
  }
}

const rest   = new REST({ version: '10' }).setToken(process.env.TOKEN);
const guildId = process.env.GUILD_ID;

(async () => {
  try {
    if (guildId) {
      console.log(`[Deploy] Registering ${commands.length} slash commands to guild ${guildId}…`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log('[Deploy] Guild commands registered successfully.');
    } else {
      console.log(`[Deploy] Registering ${commands.length} slash commands globally…`);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('[Deploy] Global commands registered successfully (may take up to 1 hour to propagate).');
    }
  } catch (e) {
    console.error('[Deploy] Error:', e.message);
  }
})();
