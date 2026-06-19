'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err }          = require('../../utils/components');
const { updateGuild }      = require('../../utils/database');

const data = new SlashCommandBuilder()
  .setName('prefix')
  .setDescription('change the bot prefix for this server')
  .addStringOption(o => o.setName('prefix').setDescription('new prefix (max 5 chars)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const category   = 'misc';
const prefixName = 'prefix';
const aliases    = ['setprefix'];

async function execute(interaction) {
  const p = interaction.options.getString('prefix');
  if (p.length > 5) return interaction.reply(err('prefix can be at most 5 characters'));
  updateGuild(interaction.guild.id, { prefix: p });
  return interaction.reply(ok(`prefix updated to \`${p}\``));
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('you need Manage Server permission'));
  const p = args[0];
  if (!p) return message.reply(err('provide a new prefix'));
  if (p.length > 5) return message.reply(err('prefix can be at most 5 characters'));
  updateGuild(message.guild.id, { prefix: p });
  return message.reply(ok(`prefix updated to \`${p}\``));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
