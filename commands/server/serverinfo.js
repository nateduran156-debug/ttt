'use strict';

const { card, COLORS }  = require('../../utils/components');
const { ChannelType }    = require('discord.js');

const category   = 'server';
const prefixName = 'serverinfo';
const aliases    = ['si', 'server'];

async function prefixExecute(message) {
  const g       = message.guild;
  const owner   = await g.fetchOwner().catch(() => null);
  const channels = g.channels.cache;

  return message.reply(card({
    title: g.name,
    fields: [
      { name: 'Owner',       value: owner ? `${owner.user.username} \`${owner.id}\`` : 'Unknown' },
      { name: 'Members',     value: `${g.memberCount}` },
      { name: 'Channels',    value: `${channels.filter(c => c.type === ChannelType.GuildText).size} text · ${channels.filter(c => c.type === ChannelType.GuildVoice).size} voice` },
      { name: 'Roles',       value: `${g.roles.cache.size}` },
      { name: 'Boosts',      value: `${g.premiumSubscriptionCount} (Level ${g.premiumTier})` },
      { name: 'Emojis',      value: `${g.emojis.cache.size}` },
      { name: 'Verification',value: g.verificationLevel.toString() },
      { name: 'Created',     value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>` },
    ],
    color:  COLORS.blue,
    footer: `ID: ${g.id}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('show an overview of the server');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
