'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err } = require('../../utils/components');

const data = new SlashCommandBuilder()
  .setName('clonechannel')
  .setDescription('clone a channel with the same settings and permissions')
  .addChannelOption(o => o.setName('channel').setDescription('channel to clone (default: current)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

const category   = 'moderation';
const prefixName = 'clonechannel';
const aliases    = ['clone', 'copychannel'];

async function execute(interaction) {
  const ch = interaction.options.getChannel('channel') || interaction.channel;
  try {
    const cloned = await ch.clone();
    await cloned.setPosition(ch.position + 1);
    await interaction.reply(ok(`Cloned ${ch} → ${cloned}`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));
  const ch = message.mentions.channels.first() || message.channel;
  try {
    const cloned = await ch.clone();
    await message.reply(ok(`Cloned ${ch} → ${cloned}`));
  } catch (e) {
    await message.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
