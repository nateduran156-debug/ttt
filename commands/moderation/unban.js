'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'unban';
const aliases    = ['ub', 'pardon'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
    return message.reply(err('You need the **Ban Members** permission.'));

  const userId = args[0];
  if (!userId) return message.reply(err('Provide a user ID to unban.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await message.guild.bans.remove(userId, reason);
    return message.reply(ok(`<@${userId}> has been unbanned.`));
  } catch (e) {
    message.reply(err(`Unban failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('unban a user so they can rejoin')
  .addStringOption(o => o.setName('user_id').setDescription('Discord user ID to unban').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the unban'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

async function execute(interaction) {
  const userId = interaction.options.getString('user_id');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  try {
    const user = await interaction.client.users.fetch(userId).catch(() => null);
    await interaction.guild.members.unban(userId, reason);
    await interaction.reply(ok(`Unbanned **${user?.tag ?? userId}** — ${reason}`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
