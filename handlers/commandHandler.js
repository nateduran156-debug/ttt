'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Recursively reads all .js files within a directory.
 */
function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files       = walkDir(commandsDir);

  client.commands     = client.commands     || new Map();
  client.aliases      = client.aliases      || new Map();
  client.slashCommands= client.slashCommands|| new Map();

  for (const file of files) {
    try {
      const cmd = require(file);

      // Slash command
      if (cmd.data) {
        client.slashCommands.set(cmd.data.name, cmd);
      }

      // Prefix command name
      const prefixName = cmd.prefixName || cmd.data?.name;
      if (prefixName) {
        client.commands.set(prefixName, cmd);
      }

      // Aliases
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          client.aliases.set(alias, prefixName || alias);
        }
      }
    } catch (e) {
      console.error(`[CommandHandler] Failed to load ${file}: ${e.message}`);
    }
  }

  const slashList   = [...client.slashCommands.keys()].sort();
  const prefixList  = [...client.commands.keys()].sort();

  console.log(`[CommandHandler] Loaded ${prefixList.length} prefix commands and ${slashList.length} slash commands.`);

  console.log('[CommandHandler] Slash commands:');
  slashList.forEach(name => console.log(`  /${name}`));

  console.log('[CommandHandler] Prefix commands:');
  prefixList.forEach(name => console.log(`  !${name}`));
}

module.exports = { loadCommands };
