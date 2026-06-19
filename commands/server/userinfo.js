'use strict';

const { card, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'userinfo';
const aliases    = ['ui', 'whois', 'user'];

async function prefixExecute(message, args) {
  const member = message.mentions.members.first()
    || await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member) return;

  const user  = member.user;
  const roles = member.roles.cache
    .filter(r => r.id !== message.guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => `<@&${r.id}>`)
    .join(' ') || 'None';

  return message.reply(card({
    title:  user.username,
    fields: [
      { name: 'ID',      value: `\`${user.id}\`` },
      { name: 'Account created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
      { name: 'Joined',  value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` },
      { name: 'Nickname',value: member.nickname || 'None' },
      { name: 'Boost',   value: member.premiumSinceTimestamp ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:D>` : 'Not boosting' },
      { name: 'Roles',   value: roles.length > 600 ? roles.slice(0, 600) + '…' : roles },
    ],
    color:  member.displayColor || COLORS.blue,
    footer: `Bot: ${user.bot ? 'Yes' : 'No'}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('show Discord info about a user')
  .addUserOption(o => o.setName('user').setDescription('user to look up (default: yourself)'));

async function execute(interaction) {
  const user   = interaction.options.getUser('user') || interaction.user;
  const member = await interaction.guild.members.fetch(user.id).catch(() => null) || { user, roles: { cache: new Map() } };
  const roles  = member.roles?.cache ? [...member.roles.cache.values()].filter(r => r.id !== interaction.guild.id) : [];
  const joined = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown';
  const created = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`;
  await interaction.reply(card({
    title: user.tag ?? user.username,
    fields: [
      { name: 'ID',        value: user.id,                                   inline: true },
      { name: 'Created',  value: created,                                    inline: true },
      { name: 'Joined',   value: joined,                                     inline: true },
      { name: 'Roles',    value: roles.slice(0, 10).join(' ') || 'None',     inline: false },
    ],
    color: COLORS.blue,
    image: user.displayAvatarURL({ size: 256 }),
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
