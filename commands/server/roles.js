'use strict';

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, SlashCommandBuilder,
} = require('discord.js');

const category   = 'server';
const prefixName = 'roles';
const aliases    = ['rolelist', 'listroles'];
const PAGE_SIZE  = 10;

// In-memory pagination cache  msgId → { roles, page, sort, userId }
const rolesCache = new Map();

function sortedRoles(roles, sort) {
  const base = [...roles];
  if (sort === 'alpha') base.sort((a, b) => a.name.localeCompare(b.name));
  // default is already position-sorted (highest first)
  return base;
}

function buildEmbed(guild, roles, page, sort, requester) {
  const sorted     = sortedRoles(roles, sort);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const slice      = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const lines = slice.map((r, i) => {
    const num = page * PAGE_SIZE + i + 1;
    return `${num} <@&${r.id}>`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setAuthor({ name: requester.username, iconURL: requester.displayAvatarURL({ dynamic: true }) })
    .setTitle('Roles')
    .setDescription(lines || 'No roles found.')
    .setFooter({ text: `Page ${page + 1}/${totalPages} (${sorted.length} entries)` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('roles_prev')
      .setLabel('<')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('roles_next')
      .setLabel('>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page + 1 >= totalPages),
    new ButtonBuilder()
      .setCustomId('roles_sort')
      .setLabel('⇅')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('roles_close')
      .setLabel('✕')
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row], allowedMentions: { parse: [] } };
}

async function prefixExecute(message) {
  const roles = [...message.guild.roles.cache.values()]
    .sort((a, b) => b.position - a.position)
    .filter(r => r.id !== message.guild.id);

  const payload = buildEmbed(message.guild, roles, 0, 'pos', message.author);
  const msg = await message.reply(payload);
  rolesCache.set(msg.id, { roles, page: 0, sort: 'pos', userId: message.author.id });
  setTimeout(() => rolesCache.delete(msg.id), 5 * 60 * 1000);
}

const data = new SlashCommandBuilder()
  .setName('roles')
  .setDescription('list all roles in the server');

async function execute(interaction) {
  const roles = [...interaction.guild.roles.cache.values()]
    .sort((a, b) => b.position - a.position)
    .filter(r => r.id !== interaction.guild.id);

  const payload = buildEmbed(interaction.guild, roles, 0, 'pos', interaction.user);
  const msg = await interaction.reply({ ...payload, fetchReply: true });
  rolesCache.set(msg.id, { roles, page: 0, sort: 'pos', userId: interaction.user.id });
  setTimeout(() => rolesCache.delete(msg.id), 5 * 60 * 1000);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute, rolesCache, buildEmbed };
