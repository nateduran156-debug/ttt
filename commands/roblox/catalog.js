'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { card, err, COLORS }   = require('../../utils/components');
const { searchCatalog }       = require('../../utils/roblox');

const data = new SlashCommandBuilder()
  .setName('catalog')
  .setDescription('search the Roblox catalog for items')
  .addStringOption(o => o.setName('query').setDescription('search query').setRequired(true))
  .addStringOption(o => o.setName('category').setDescription('item category').addChoices(
    { name: 'All',         value: '0' },
    { name: 'Accessories', value: '9' },
    { name: 'Clothing',    value: '3' },
    { name: 'Gear',        value: '5' },
  ));

const category   = 'roblox';
const prefixName = 'catalog';
const aliases    = ['shop', 'items'];

async function execute(interaction) {
  await interaction.deferReply();
  const query    = interaction.options.getString('query');
  const cat      = interaction.options.getString('category') || '0';
  const results  = await searchCatalog(query, cat).catch(() => null);
  if (!results?.length) return interaction.editReply(err(`No results for **${query}**.`));
  await interaction.editReply(card({
    title:  `Catalog: ${query}`,
    desc:   results.slice(0, 10).map(i =>
      `**[${i.name}](https://www.roblox.com/catalog/${i.id})** — ${i.price != null ? `${i.price} R$` : 'free'}`
    ).join('\n'),
    color:  COLORS.teal,
    footer: `${results.length} results`,
  }));
}

async function prefixExecute(message, args) {
  if (!args.length) return message.reply(err('Provide a search query.'));
  const query   = args.join(' ');
  const results = await searchCatalog(query, '0').catch(() => null);
  if (!results?.length) return message.reply(err(`No results for **${query}**.`));
  await message.reply(card({
    title: `Catalog: ${query}`,
    desc:  results.slice(0, 5).map(i => `**${i.name}** — ${i.price != null ? `${i.price} R$` : 'free'}`).join('\n'),
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
