'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'massban';
const aliases    = ['mban', 'bulkban'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
    return message.reply(err('You need the **Ban Members** permission.'));

  const ids    = args.filter(a => /^\d{17,19}$/.test(a));
  const reason = args.filter(a => !/^\d{17,19}$/.test(a)).join(' ') || 'Mass ban';

  if (!ids.length) return message.reply(err('Provide at least one user ID to ban.'));

  let banned = 0;
  for (const id of ids) {
    await message.guild.bans.create(id, { reason, deleteMessageSeconds: 86400 })
      .then(() => banned++)
      .catch(() => {});
  }

  message.reply(ok(`Banned **${banned}/${ids.length}** users — **${reason}**`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('massban')
  .setDescription('ban multiple users by ID at once')
  .addStringOption(o => o.setName('userids').setDescription('space-separated user IDs').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the mass ban'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

async function execute(interaction) {
  const ids    = interaction.options.getString('userids').split(/\s+/).filter(Boolean);
  const reason = interaction.options.getString('reason') || 'Mass ban';
  await interaction.deferReply();
  let banned = 0, failed = 0;
  for (const id of ids) {
    await interaction.guild.members.ban(id, { reason }).then(() => banned++).catch(() => failed++);
  }
  await interaction.editReply(ok(`Banned **${banned}** user(s)${failed ? `, ${failed} failed` : ''}. Reason: ${reason}`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
