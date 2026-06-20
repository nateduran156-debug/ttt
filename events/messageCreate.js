'use strict';

const { getPrefix, resolveAlias, getAutoResponders, ensureGuild } = require('../utils/database');
const { isWhitelisted, hasBotAccess } = require('../utils/whitelist');
const { err }               = require('../utils/components');
const { OWNER_ID }          = require('../utils/constants');
const { PermissionFlagsBits } = require('discord.js');

// Tag-related commands allowed in DMs
const DM_ALLOWED_CMDS = new Set(['tag', 't', 'striptag', 'tagstrip', 'st']);

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // ── DM handling — only tag-related commands allowed ──────────────────────
    if (!message.guild) {
      const prefix = '!';
      if (!message.content.startsWith(prefix)) return;
      const args    = message.content.slice(prefix.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();
      if (!DM_ALLOWED_CMDS.has(cmdName)) return;

      const resolved = client.aliases.get(cmdName);
      const finalCmd = resolved ?? cmdName;
      const cmd = client.commands.get(finalCmd);
      if (!cmd || typeof cmd.prefixExecute !== 'function') return;

      // DM context: no guild/member, fabricate a minimal message object
      const dmMessage = Object.assign(Object.create(Object.getPrototypeOf(message)), message, {
        guild: null, member: null,
      });
      try {
        await cmd.prefixExecute(dmMessage, args);
      } catch (e) {
        console.error(`[MessageCreate DM] Error in ${finalCmd}: ${e.message}`);
        message.reply(`An error occurred: ${e.message}`).catch(() => {});
      }
      return;
    }

    ensureGuild(message.guild.id);

    // ── Global whitelist gate — silently ignore non-whitelisted users ────────
    if (!hasBotAccess(message.member)) return;

    // ── Auto-responders ──────────────────────────────────────────────────────
    const responders = getAutoResponders(message.guild.id);
    for (const ar of responders) {
      const content = message.content.toLowerCase();
      const trigger = ar.trigger.toLowerCase();
      let matched = false;
      if (ar.match_type === 'exact')       matched = content === trigger;
      else if (ar.match_type === 'startswith') matched = content.startsWith(trigger);
      else                                     matched = content.includes(trigger);
      if (matched) {
        await message.channel.send({ content: ar.response }).catch(() => {});
        break;
      }
    }

    // ── Prefix commands ──────────────────────────────────────────────────────
    const prefix = getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args    = message.content.slice(prefix.length).trim().split(/\s+/);
    let cmdName   = args.shift().toLowerCase();

    // Resolve custom aliases first, then built-in command aliases
    const aliasTarget = resolveAlias(message.guild.id, cmdName);
    if (aliasTarget) cmdName = aliasTarget;

    const resolved = client.aliases.get(cmdName);
    if (resolved) cmdName = resolved;

    const cmd = client.commands.get(cmdName);
    if (!cmd || typeof cmd.prefixExecute !== 'function') return;

    // Determine the command's category for whitelist checks
    const category = cmd.category || 'all';

    if (!isWhitelisted(message.member, category)) return;

    // All commands: show greed-style help when called with no arguments
    if (args.length === 0) {
      const { findPage, openHelp } = require('../utils/cmdHelp');
      return openHelp(message, findPage(cmdName), prefix);
    }

    try {
      await cmd.prefixExecute(message, args);
    } catch (e) {
      console.error(`[MessageCreate] Error in ${cmdName}: ${e.message}`);
      message.reply(err(`An error occurred: ${e.message}`)).catch(() => {});
    }
  },
};
