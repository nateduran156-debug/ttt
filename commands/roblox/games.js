'use strict';

const { card, err, COLORS }           = require('../../utils/components');
const { getUserByUsername, getUserGames } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'games';
const aliases    = ['rgames', 'usergames'];

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

  const games = await getUserGames(user.id).catch(() => []);
  if (!games.length) return message.reply(card({ title: `${user.name ?? input}'s Games`, desc: 'No public games found.', color: COLORS.gray }));

  return message.reply(card({
    title: `${user.name ?? input}'s Games`,
    desc:  games.slice(0, 10).map(g => `**${g.name}** — ${g.placeVisits?.toLocaleString() ?? '?'} visits`).join('\n'),
    color: COLORS.teal,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('games')
  .setDescription('list games created by a Roblox user')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u     = isNaN(input) ? await getUserByUsername(input).catch(() => null) : { id: input, name: input };
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const games = await getUserGames(u.id).catch(() => null);
  if (!games?.length) return interaction.editReply(err(`No games found for **${u.name ?? input}**.`));
  await interaction.editReply(card({
    title: `Games — ${u.name ?? input}`,
    desc:  games.slice(0, 8).map(g =>
      `**[${g.name}](https://www.roblox.com/games/${g.rootPlaceId})** — ${g.visits?.toLocaleString() ?? '?'} visits`
    ).join('\n'),
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
