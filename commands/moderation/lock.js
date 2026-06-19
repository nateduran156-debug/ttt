'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'lock';
const aliases    = ['lockdown'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const ch     = message.mentions.channels.first() || message.channel;
  const reason = args.join(' ') || 'Channel locked by a moderator';

  try {
    await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: false }, { reason });
    message.reply(ok(`🔒 ${ch} has been locked — **${reason}**`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('prevent @everyone from sending messages in a channel')
  .addChannelOption(o => o.setName('channel').setDescription('channel to lock (default: current)'))
  .addStringOption(o => o.setName('reason').setDescription('reason for the lockdown'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const ch     = interaction.options.getChannel('channel') || interaction.channel;
  const reason = interaction.options.getString('reason') || 'No reason provided';
  try {
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply(ok(`🔒 Locked ${ch}. ${reason}`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
