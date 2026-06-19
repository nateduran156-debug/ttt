'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'deafen';
const aliases    = ['deaf'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.DeafenMembers))
    return message.reply(err('You need the **Deafen Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));
  if (!member.voice.channel) return message.reply(err('That member is not in a voice channel.'));

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await member.voice.setDeaf(true, reason);
    message.reply(modCard({ action: 'Deafened', user: member.user, mod: message.author, reason }));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('deafen')
  .setDescription('server-deafen a member in voice')
  .addUserOption(o => o.setName('user').setDescription('member to deafen').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason'))
  .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('Member not found.'));
  try {
    await member.voice.setDeaf(true, reason);
    await interaction.reply(ok(`Deafened ${user}. ${reason}`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
