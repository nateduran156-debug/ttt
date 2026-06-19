'use strict';

(function bootstrap() {
  try { require.resolve('discord.js'); } catch (_) {
    console.log('[Boot] Installing dependencies...');
    require('child_process').execSync('npm install --omit=dev', { stdio: 'inherit', cwd: __dirname });
    console.log('[Boot] Done.');
  }
})();

const fs   = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch {}

const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const { loadCommands }  = require('./handlers/commandHandler');
const { loadEvents }    = require('./handlers/eventHandler');
const { ensureGuild }   = require('./utils/database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Initialize all command and event handlers
loadCommands(client);
loadEvents(client);

// Ensure each guild is registered in the database upon joining
client.on('guildCreate', guild => ensureGuild(guild.id));

const token    = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID;

if (!token) {
  console.error('[Error] TOKEN is not set. Please add your bot token.');
  process.exit(1);
}

if (!clientId) {
  console.error('[Error] CLIENT_ID is not set. Please add your application ID.');
  process.exit(1);
}

// Auto-register slash commands on startup
async function deployCommands() {
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
  const files = walkDir(path.join(__dirname, 'commands'));
  for (const file of files) {
    try {
      const cmd = require(file);
      if (cmd.data?.toJSON) commands.push(cmd.data.toJSON());
    } catch (e) {
      console.warn(`[Deploy] Skipped ${path.basename(file)}: ${e.message}`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    if (guildId) {
      console.log(`[Deploy] Registering ${commands.length} slash commands to guild ${guildId}…`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('[Deploy] Guild commands registered successfully.');
    } else {
      console.log(`[Deploy] Registering ${commands.length} slash commands globally…`);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('[Deploy] Global commands registered (may take up to 1 hour to propagate).');
    }
  } catch (e) {
    console.error('[Deploy] Failed to register slash commands:', e.message);
  }
}

client.once('ready', async () => {
  console.log(`[Ready] Logged in as ${client.user.tag}`);
  await deployCommands();
});

client.login(token).catch(err => {
  console.error('[Error] Failed to log in:', err.message);
  process.exit(1);
});

