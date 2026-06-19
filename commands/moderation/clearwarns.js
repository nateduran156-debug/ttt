'use strict';

const { ok, err }             = require('../../utils/components');
const { clearWarnings }        = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'clearwarns';
const aliases    = ['clearwarnings', 'warnreset'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));

  clearWarnings(message.guild.id, member.id);
  return message.reply(ok(`All warnings have been cleared for ${member}.`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('clearwarns')
  .setDescription('clear all warnings from a user\'s record')
  .addUserOption(o => o.setName('user').setDescription('user to clear warnings for').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user = interaction.options.getUser('user');
  clearWarnings(interaction.guild.id, user.id);
  await interaction.reply(ok(`Cleared all warnings for ${user}.`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
