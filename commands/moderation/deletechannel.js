'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'deletechannel';
const aliases    = ['dc', 'delchannel', 'rmchannel'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const ch     = message.mentions.channels.first() || message.channel;
  const reason = args.join(' ') || 'No reason provided';

  try {
    const name = ch.name;
    await ch.delete(reason);
    if (ch.id !== message.channel.id) {
      message.reply(ok(`Channel **#${name}** has been deleted.`));
    }
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('deletechannel')
  .setDescription('delete a channel from the server')
  .addChannelOption(o => o.setName('channel').setDescription('channel to delete').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const ch = interaction.options.getChannel('channel');
  try {
    await ch.delete();
    await interaction.reply(ok(`Deleted channel **${ch.name}**.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
