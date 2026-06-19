'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'softban';
const aliases    = ['sb'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
    return message.reply(err('You need the **Ban Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to soft-ban.'));
  if (!member.bannable) return message.reply(err('I cannot ban that member.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await message.guild.bans.create(member.id, { reason, deleteMessageSeconds: 604800 });
    await message.guild.bans.remove(member.id);
    message.reply(modCard({
      action: 'Soft Banned',
      user: member.user,
      mod:  message.author,
      reason,
      extra: { 'Deleted': '7 days of messages' },
    }));
  } catch (e) {
    message.reply(err(`Soft ban failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('softban')
  .setDescription('ban then immediately unban to wipe recent messages')
  .addUserOption(o => o.setName('user').setDescription('member to softban').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the softban'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Softban';
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (member && !member.bannable) return interaction.reply(err('I cannot ban that member.'));
  try {
    await interaction.guild.members.ban(user, { reason, deleteMessageDays: 7 });
    await interaction.guild.members.unban(user.id, 'Softban — auto-unban');
    await interaction.reply(modCard({ action: 'Softban', user, mod: interaction.user, reason }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
