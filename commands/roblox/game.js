'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { card, err, COLORS }   = require('../../utils/components');
const { getGameInfo }         = require('../../utils/roblox');

const data = new SlashCommandBuilder()
  .setName('game')
  .setDescription('look up a Roblox game by place ID')
  .addStringOption(o => o.setName('placeid').setDescription('Roblox place/game ID').setRequired(true));

const category   = 'roblox';
const prefixName = 'game';
const aliases    = ['place', 'robloxgame'];

async function execute(interaction) {
  const placeId = interaction.options.getString('placeid');
  await interaction.deferReply();
  const g = await getGameInfo(placeId).catch(() => null);
  if (!g) return interaction.editReply(err(`Game **${placeId}** not found.`));
  await interaction.editReply(card({
    title:  g.name,
    desc:   g.description?.slice(0, 300) || 'No description.',
    fields: [
      { name: 'Visits',    value: g.visits?.toLocaleString()        ?? '?' },
      { name: 'Playing',   value: g.playing?.toLocaleString()       ?? '?' },
      { name: 'Favorites', value: g.favoritedCount?.toLocaleString() ?? '?' },
      { name: 'Created',   value: g.created ? `<t:${Math.floor(new Date(g.created).getTime() / 1000)}:D>` : '?' },
    ],
    color:  COLORS.teal,
    footer: `roblox.com/games/${placeId}`,
  }));
}

async function prefixExecute(message, args) {
  const placeId = args[0];
  if (!placeId) return message.reply(err('Provide a place ID.'));
  const g = await getGameInfo(placeId).catch(() => null);
  if (!g) return message.reply(err(`Game **${placeId}** not found.`));
  await message.reply(card({
    title:  g.name,
    fields: [
      { name: 'Visits',  value: g.visits?.toLocaleString()  ?? '?' },
      { name: 'Playing', value: g.playing?.toLocaleString() ?? '?' },
    ],
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
