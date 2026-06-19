'use strict';

const { card, err, COLORS }       = require('../../utils/components');
const { getUserByUsername, getUserRap } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'rap';
const aliases    = ['limiteds', 'rap'];

async function prefixExecute(message, args) {
  const input = args[0];
  if (!input) return message.reply(err('Provide a Roblox username or ID.'));

  await message.channel.sendTyping().catch(() => {});

  let user;
  try {
    user = /^\d+$/.test(input) ? { id: input, name: input } : await getUserByUsername(input);
  } catch {
    return message.reply(err('Failed to reach the Roblox API.'));
  }
  if (!user) return message.reply(err(`No account found for **${input}**.`));

  const rap = await getUserRap(user.id).catch(() => 0);

  return message.reply(card({
    title: `${user.name ?? input}'s RAP`,
    desc:  `**Recent Average Price** ${rap.toLocaleString()} R$`,
    color: COLORS.gold,
    footer: 'Based on limited collectibles currently in the inventory',
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('rap')
  .setDescription('get total RAP (Recent Average Price) for a Roblox user\'s limiteds')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u   = isNaN(input) ? await getUserByUsername(input).catch(() => null) : { id: input, name: input };
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const rap = await getUserRap(u.id).catch(() => null);
  await interaction.editReply(card({
    title: `RAP — ${u.name ?? input}`,
    desc:  rap != null ? `Total RAP: **${rap.toLocaleString()} R$**` : 'Could not calculate RAP.',
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
