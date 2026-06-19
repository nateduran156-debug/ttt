'use strict';

const { ok, err, modCard, card } = require('../../utils/components');
const { addWarning }             = require('../../utils/database');
const { PermissionFlagsBits }    = require('discord.js');
const { sendLog }                = require('../../utils/logger');

const category   = 'moderation';
const prefixName = 'ban';
const aliases    = ['b', 'banish'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
    return message.reply(err('You need the **Ban Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) {
    const { findPage, openHelp } = require('../../utils/cmdHelp');
    const prefix = require('../../utils/database').getPrefix(message.guild.id) || '.';
    return openHelp(message, findPage('ban'), prefix);
  }
  if (!member.bannable) return message.reply(err('I cannot ban that member.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await member.ban({ reason, deleteMessageSeconds: 604800 });
    await message.reply(modCard({ action: 'Banned', user: member.user, mod: message.author, reason }));
    await sendLog(message.guild, 'mod', { color: 0xED4245, content: `🔨 **Banned** — ${member.user}\nMod: ${message.author}\nReason: ${reason}` });
  } catch (e) {
    message.reply(err(`Ban failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('permanently ban a member from the server')
  .addUserOption(o => o.setName('user').setDescription('member to ban').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the ban'))
  .addIntegerOption(o => o.setName('days').setDescription('days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const days   = interaction.options.getInteger('days') ?? 0;
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (member) {
    if (!member.bannable) return interaction.reply(err('I cannot ban that member.'));
    if (member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply(err('You cannot ban someone with a higher or equal role.'));
  }
  try {
    await interaction.guild.members.ban(user, { reason, deleteMessageDays: days });
    await interaction.reply(modCard({ action: 'Ban', user, mod: interaction.user, reason }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
