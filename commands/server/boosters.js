'use strict';

const { card, err, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'boosters';
const aliases    = ['boosts', 'nitro'];

async function prefixExecute(message) {
  const boosters = message.guild.members.cache.filter(m => m.premiumSinceTimestamp);
  if (!boosters.size) return message.reply(err('No members are currently boosting this server.'));

  return message.reply(card({
    title:  `${message.guild.name} — Boosters`,
    desc:   boosters.map(m => `${m} — since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:D>`).join('\n'),
    color:  COLORS.pink,
    footer: `${boosters.size} booster${boosters.size === 1 ? '' : 's'} · Level ${message.guild.premiumTier}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('boosters')
  .setDescription('list all current Nitro boosters in the server');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
