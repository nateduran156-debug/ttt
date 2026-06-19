'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err } = require('../utils/components');
const { getTagLogChannel, setTagLogChannel } = require('../utils/database');

const category   = 'roblox';
const prefixName = 'taglogset';
const aliases    = ['taglog'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('you need manage server to do that'));

  const ch = message.mentions.channels.first() || message.channel;
  setTagLogChannel(message.guild.id, ch.id);
  return message.reply(ok(`tag logs will go to ${ch}`));
}

const data = new SlashCommandBuilder()
  .setName('taglogset')
  .setDescription('set the channel where tag logs get sent')
  .addChannelOption(o =>
    o.setName('channel')
      .setDescription('the channel to log tags in')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const ch = interaction.options.getChannel('channel') ?? interaction.channel;
  setTagLogChannel(interaction.guild.id, ch.id);
  return interaction.reply({ ...ok(`tag logs will go to <#${ch.id}>`), ephemeral: true });
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
