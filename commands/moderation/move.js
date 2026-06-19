'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'move';
const aliases    = ['movemember', 'vc'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers))
    return message.reply(err('You need the **Move Members** permission.'));

  const member  = message.mentions.members.first();
  const channel = message.mentions.channels.first();

  if (!member) return message.reply(err('Mention a member to move.'));
  if (!member.voice.channel) return message.reply(err('That member is not in a voice channel.'));
  if (!channel) return message.reply(err('Mention a voice channel to move them to.'));

  try {
    await member.voice.setChannel(channel);
    message.reply(ok(`Moved ${member} to **${channel.name}**.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder, ChannelType } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('move')
  .setDescription('move a member to another voice channel')
  .addUserOption(o => o.setName('user').setDescription('member to move').setRequired(true))
  .addChannelOption(o => o.setName('channel').setDescription('destination voice channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice))
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const ch     = interaction.options.getChannel('channel');
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('Member not found.'));
  if (!member.voice.channel) return interaction.reply(err('That member is not in a voice channel.'));
  try {
    await member.voice.setChannel(ch);
    await interaction.reply(ok(`Moved ${user} to ${ch}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
