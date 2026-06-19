'use strict';

const { card, COLORS } = require('../../utils/components');
const { ChannelType }   = require('discord.js');

const category   = 'server';
const prefixName = 'channels';
const aliases    = ['channellist', 'listchannels'];

async function prefixExecute(message) {
  const all   = message.guild.channels.cache;
  const text  = all.filter(c => c.type === ChannelType.GuildText).size;
  const voice = all.filter(c => c.type === ChannelType.GuildVoice).size;
  const cats  = all.filter(c => c.type === ChannelType.GuildCategory).size;

  return message.reply(card({
    title: `${message.guild.name} — Channels`,
    desc:  `**Text** ${text} · **Voice** ${voice} · **Categories** ${cats}\n**Total** ${all.size}`,
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('channels')
  .setDescription('show a count breakdown of all channel types in the server');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
