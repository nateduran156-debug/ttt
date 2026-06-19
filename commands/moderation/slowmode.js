'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'slowmode';
const aliases    = ['sm', 'slow', 'ratelimit'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const ch      = message.mentions.channels.first() || message.channel;
  const seconds = parseInt(args[0]) ?? 0;

  if (isNaN(seconds) || seconds < 0 || seconds > 21600)
    return message.reply(err('Provide a number between 0 and 21600 seconds.'));

  try {
    await ch.setRateLimitPerUser(seconds);
    message.reply(ok(seconds === 0 ? `Slowmode disabled in ${ch}.` : `Slowmode set to **${seconds}s** in ${ch}.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('set slowmode delay in a channel (0 = off)')
  .addIntegerOption(o => o.setName('seconds').setDescription('delay in seconds (0-21600)').setRequired(true).setMinValue(0).setMaxValue(21600))
  .addChannelOption(o => o.setName('channel').setDescription('channel to apply slowmode (default: current)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const secs = interaction.options.getInteger('seconds');
  const ch   = interaction.options.getChannel('channel') || interaction.channel;
  try {
    await ch.setRateLimitPerUser(secs);
    await interaction.reply(ok(secs === 0 ? `Slowmode disabled in ${ch}.` : `Slowmode set to **${secs}s** in ${ch}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
