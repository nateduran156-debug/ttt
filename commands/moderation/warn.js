'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { addWarning }          = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'warn';
const aliases    = ['w', 'warning'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to warn.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';
  addWarning(message.guild.id, member.id, message.author.id, reason);

  await message.reply(modCard({ action: 'Warned', user: member.user, mod: message.author, reason }));
  member.user.send({ content: `⚠️ You have been warned in **${message.guild.name}**: ${reason}` }).catch(() => {});
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('issue a logged warning to a member')
  .addUserOption(o => o.setName('user').setDescription('member to warn').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the warning').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');
  addWarning(interaction.guild.id, user.id, interaction.user.id, reason);
  await interaction.reply(modCard({ action: 'Warn', user, mod: interaction.user, reason }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
