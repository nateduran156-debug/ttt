'use strict';

const { card, err, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'emoji';
const aliases    = ['emotes', 'emojis', 'emojilist'];

async function prefixExecute(message) {
  const emojis = message.guild.emojis.cache;
  if (!emojis.size) return message.reply(err('This server has no custom emojis.'));

  const list = emojis.map(e => `${e} \`${e.name}\``).slice(0, 30).join(' ');

  return message.reply(card({
    title:  `${message.guild.name} — Emojis`,
    desc:   list + (emojis.size > 30 ? `\n*…and ${emojis.size - 30} more*` : ''),
    color:  COLORS.blue,
    footer: `${emojis.size} emoji${emojis.size === 1 ? '' : 's'}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('emoji')
  .setDescription('list all custom emoji in the server');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
