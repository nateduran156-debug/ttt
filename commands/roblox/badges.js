'use strict';

const { card, err, COLORS }           = require('../../utils/components');
const { getUserByUsername, getUserBadges } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'badges';
const aliases    = ['badge', 'rb'];

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

  const badges = await getUserBadges(user.id).catch(() => []);

  if (!badges.length) return message.reply(card({ title: `${user.name ?? input}'s Badges`, desc: 'No recent badges.', color: COLORS.gray }));

  return message.reply(card({
    title:  `${user.name ?? input}'s Recent Badges`,
    desc:   badges.slice(0, 15).map(b => `**${b.name}** — ${b.description?.slice(0, 60) || 'No description'}`).join('\n'),
    color:  COLORS.gold,
    footer: `Showing up to 15 most recent badges`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('badges')
  .setDescription('list the badges a Roblox user has earned')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u      = isNaN(input) ? await getUserByUsername(input).catch(() => null) : { id: input, name: input };
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const badges = await getUserBadges(u.id).catch(() => null);
  if (!badges?.length) return interaction.editReply(err(`No badges found for **${u.name ?? input}**.`));
  await interaction.editReply(card({
    title: `Badges — ${u.name ?? input}`,
    desc:  badges.slice(0, 15).map(b => `**${b.name}** — ${b.description?.slice(0, 60) || ''}`).join('\n'),
    color: COLORS.teal,
    footer: `${badges.length} total badges`,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
