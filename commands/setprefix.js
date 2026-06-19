'use strict';

const { setPrefix }            = require('../utils/database');
const { ok, err }              = require('../utils/components');
const { PermissionFlagsBits }  = require('discord.js');

const category   = 'all';
const prefixName = 'setprefix';
const aliases    = ['prefix'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return message.reply(err('You need the **Manage Server** permission to change the prefix.'));
  }

  const newPrefix = args[0];
  if (!newPrefix) return message.reply(err('Provide a new prefix. Example: `.setprefix !`'));
  if (newPrefix.length > 5) return message.reply(err('The prefix must be 5 characters or fewer.'));

  setPrefix(message.guild.id, newPrefix);
  return message.reply(ok(`Prefix updated to \`${newPrefix}\`.`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('setprefix')
  .setDescription('change the bot\'s command prefix for this server')
  .addStringOption(o => o.setName('prefix').setDescription('new prefix (max 5 characters)').setRequired(true).setMaxLength(5))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const newPrefix = interaction.options.getString('prefix');
  if (newPrefix.length > 5) return interaction.reply(err('The prefix must be 5 characters or fewer.'));
  setPrefix(interaction.guild.id, newPrefix);
  await interaction.reply(ok(`Prefix updated to \`${newPrefix}\`.`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
