'use strict';

const { getGuild, ensureGuild, db } = require('../utils/database');
const { ok, err, card, COLORS }      = require('../utils/components');
const { PermissionFlagsBits }         = require('discord.js');

const category   = 'logging';
const prefixName = 'setlogs';
const aliases    = ['logs', 'setlog'];

const LOG_TYPES = {
  mod:      'mod_log_channel',
  messages: 'message_log_channel',
  join:     'join_log_channel',
  leave:    'leave_log_channel',
  voice:    'voice_log_channel',
  general:  'log_channel',
  all:      null,
};

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const guildId = message.guild.id;
  ensureGuild(guildId);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === 'status') {
    const g = getGuild(guildId);
    return message.reply(card({
      title: 'Log Channels',
      desc: [
        `**General** ${g.log_channel ? `<#${g.log_channel}>` : 'Not set'}`,
        `**Mod Actions** ${g.mod_log_channel ? `<#${g.mod_log_channel}>` : 'Not set'}`,
        `**Messages** ${g.message_log_channel ? `<#${g.message_log_channel}>` : 'Not set'}`,
        `**Joins** ${g.join_log_channel ? `<#${g.join_log_channel}>` : 'Not set'}`,
        `**Leaves** ${g.leave_log_channel ? `<#${g.leave_log_channel}>` : 'Not set'}`,
        `**Voice** ${g.voice_log_channel ? `<#${g.voice_log_channel}>` : 'Not set'}`,
      ].join('\n'),
      color: COLORS.blue,
    }));
  }

  const ch = message.mentions.channels.first();
  if (!ch && sub !== 'clear') return message.reply(err('Mention a channel.'));

  if (sub === 'all') {
    const col = LOG_TYPES.general;
    db.prepare(`UPDATE guilds SET log_channel = ? WHERE guild_id = ?`).run(ch?.id || null, guildId);
    return message.reply(ok(`General log channel ${ch ? `set to ${ch}` : 'cleared'}.`));
  }

  if (sub === 'clear') {
    db.prepare('UPDATE guilds SET log_channel = NULL, mod_log_channel = NULL, message_log_channel = NULL, join_log_channel = NULL, leave_log_channel = NULL, voice_log_channel = NULL WHERE guild_id = ?').run(guildId);
    return message.reply(ok('All log channels have been cleared.'));
  }

  const field = LOG_TYPES[sub];
  if (!field) return message.reply(err(`Unknown log type. Valid: ${Object.keys(LOG_TYPES).join(', ')}`));

  db.prepare(`UPDATE guilds SET ${field} = ? WHERE guild_id = ?`).run(ch.id, guildId);
  return message.reply(ok(`**${sub}** log channel set to ${ch}.`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('logs')
  .setDescription('configure log channels for different event types')
  .addSubcommand(s => s
    .setName('setup')
    .setDescription('set the fallback log channel')
    .addChannelOption(o => o.setName('channel').setDescription('channel for logs').setRequired(true)))
  .addSubcommand(s => s
    .setName('modlogs')
    .setDescription('set the mod action log channel')
    .addChannelOption(o => o.setName('channel').setDescription('channel for mod logs').setRequired(true)))
  .addSubcommand(s => s
    .setName('messages')
    .setDescription('set the message log channel')
    .addChannelOption(o => o.setName('channel').setDescription('channel for message logs').setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const ch  = interaction.options.getChannel('channel');
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const fieldMap = { setup: 'log_channel', modlogs: 'mod_log_channel', messages: 'message_log_channel' };
  db.prepare(`UPDATE guilds SET ${fieldMap[sub]} = ? WHERE id = ?`).run(ch.id, guildId);
  await interaction.reply(ok(`${sub.charAt(0).toUpperCase() + sub.slice(1)} log channel set to ${ch}.`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
