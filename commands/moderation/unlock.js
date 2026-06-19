'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'unlock';
const aliases    = ['ul', 'unlockdown'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const ch     = message.mentions.channels.first() || message.channel;
  const reason = args.join(' ') || 'Channel unlocked by a moderator';

  try {
    await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: null }, { reason });
    message.reply(ok(`🔓 ${ch} has been unlocked.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('restore send permissions in a channel')
  .addChannelOption(o => o.setName('channel').setDescription('channel to unlock (default: current)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const ch = interaction.options.getChannel('channel') || interaction.channel;
  try {
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    await interaction.reply(ok(`🔓 Unlocked ${ch}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
