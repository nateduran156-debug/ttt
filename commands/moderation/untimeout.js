'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { modCard, err } = require('../../utils/components');

const data = new SlashCommandBuilder()
  .setName('untimeout')
  .setDescription('remove an active timeout from a member')
  .addUserOption(o => o.setName('user').setDescription('member to un-timeout').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for removal'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

const category   = 'moderation';
const prefixName = 'untimeout';
const aliases    = ['unmute', 'uto'];

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = interaction.guild.members.cache.get(user.id);
  if (!member) return interaction.reply(err('That user is not in this server.'));
  try {
    await member.timeout(null, reason);
    await interaction.reply(modCard({ action: 'Timeout Removed', user, mod: interaction.user, reason }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));
  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.timeout(null, reason);
    await message.reply(modCard({ action: 'Timeout Removed', user: member.user, mod: message.author, reason }));
  } catch (e) {
    await message.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
