'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');
const { sendLog }             = require('../../utils/logger');

const category   = 'moderation';
const prefixName = 'kick';
const aliases    = ['k', 'remove'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
    return message.reply(err('You need the **Kick Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to kick.'));
  if (!member.kickable) return message.reply(err('I cannot kick that member.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await member.kick(reason);
    await message.reply(modCard({ action: 'Kicked', user: member.user, mod: message.author, reason }));
    await sendLog(message.guild, 'mod', { color: 0xFF6B35, content: `👢 **Kicked** — ${member.user}\nMod: ${message.author}\nReason: ${reason}` });
  } catch (e) {
    message.reply(err(`Kick failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('remove a member from the server')
  .addUserOption(o => o.setName('user').setDescription('member to kick').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the kick'))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('That user is not in this server.'));
  if (!member.kickable) return interaction.reply(err('I cannot kick that member.'));
  if (member.roles.highest.position >= interaction.member.roles.highest.position)
    return interaction.reply(err('You cannot kick someone with a higher or equal role.'));
  try {
    await member.kick(reason);
    await interaction.reply(modCard({ action: 'Kick', user, mod: interaction.user, reason }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
