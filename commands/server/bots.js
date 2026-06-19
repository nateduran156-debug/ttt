'use strict';

const { card, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'bots';
const aliases    = ['botlist'];

async function prefixExecute(message) {
  const bots = message.guild.members.cache.filter(m => m.user.bot);
  return message.reply(card({
    title:  `${message.guild.name} — Bots`,
    desc:   bots.map(m => `${m.user.username} \`${m.id}\``).join('\n') || 'None',
    color:  COLORS.blue,
    footer: `${bots.size} bot${bots.size === 1 ? '' : 's'}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('bots')
  .setDescription('list all bots in the server');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
