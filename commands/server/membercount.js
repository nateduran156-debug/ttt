'use strict';

const { card, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'membercount';
const aliases    = ['mc', 'count'];

async function prefixExecute(message) {
  const g      = message.guild;
  const humans = g.members.cache.filter(m => !m.user.bot).size;
  const bots   = g.memberCount - humans;

  return message.reply(card({
    title: `${g.name} — Member Count`,
    desc:  `**Total** ${g.memberCount}\n**Humans** ${humans}\n**Bots** ${bots}`,
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('membercount')
  .setDescription('show total member count split by humans and bots');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
