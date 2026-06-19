'use strict';

const { card, COLORS } = require('../../utils/components');
const { ChannelType }   = require('discord.js');

const category   = 'server';
const prefixName = 'channelinfo';
const aliases    = ['ci', 'channel'];

const TYPE_NAMES = {
  [ChannelType.GuildText]:        'Text',
  [ChannelType.GuildVoice]:       'Voice',
  [ChannelType.GuildCategory]:    'Category',
  [ChannelType.GuildAnnouncement]:'Announcement',
  [ChannelType.GuildForum]:       'Forum',
  [ChannelType.GuildStageVoice]:  'Stage',
  [ChannelType.GuildThread]:      'Thread',
};

async function prefixExecute(message, args) {
  const ch = message.mentions.channels.first() || message.channel;

  return message.reply(card({
    title:  `#${ch.name}`,
    fields: [
      { name: 'ID',       value: ch.id },
      { name: 'Type',     value: TYPE_NAMES[ch.type] || 'Unknown' },
      { name: 'Category', value: ch.parent?.name ?? 'None' },
      { name: 'Created',  value: `<t:${Math.floor(ch.createdTimestamp / 1000)}:D>` },
      { name: 'Topic',    value: ch.topic || 'None' },
      { name: 'NSFW',     value: ch.nsfw ? 'Yes' : 'No' },
      { name: 'Slowmode', value: ch.rateLimitPerUser ? `${ch.rateLimitPerUser}s` : 'Disabled' },
    ],
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('channelinfo')
  .setDescription('show details about a channel')
  .addChannelOption(o => o.setName('channel').setDescription('channel to inspect (default: current)'));

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
