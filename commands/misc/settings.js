'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { card, err, COLORS } = require('../../utils/components');
const { getGuild }          = require('../../utils/database');

const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('view this server\'s bot settings')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const category   = 'misc';
const prefixName = 'settings';
const aliases    = ['config', 'cfg'];

async function execute(interaction) {
  const g = getGuild(interaction.guild.id);
  await interaction.reply(card({
    title:  `settings — ${interaction.guild.name}`,
    fields: [
      { name: 'Prefix',         value: `\`${g.prefix || '!'}\`` },
      { name: 'Welcome',        value: g.welcome_enabled ? `✅ <#${g.welcome_channel}>` : '❌ off' },
      { name: 'Mod Logs',       value: g.mod_log_channel ? `<#${g.mod_log_channel}>` : 'not set' },
      { name: 'Server Logs',    value: g.log_channel     ? `<#${g.log_channel}>`     : 'not set' },
      { name: 'AutoMod',        value: g.automod_enabled  ? '✅ on' : '❌ off' },
      { name: 'Anti-Nuke',      value: g.antinuke_enabled ? '✅ on' : '❌ off' },
      { name: 'Ticket Category',value: g.ticket_category  ? `<#${g.ticket_category}>` : 'not set' },
    ],
    color:  COLORS.blue,
    footer: 'use /setup commands to configure',
  }));
}

async function prefixExecute(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('you need Manage Server permission'));
  const g = getGuild(message.guild.id);
  await message.reply(card({
    title:  `settings — ${message.guild.name}`,
    fields: [
      { name: 'Prefix',   value: `\`${g.prefix || '!'}\`` },
      { name: 'Welcome',  value: g.welcome_enabled  ? '✅ on' : '❌ off' },
      { name: 'AutoMod',  value: g.automod_enabled  ? '✅ on' : '❌ off' },
    ],
    color: COLORS.blue,
  }));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
