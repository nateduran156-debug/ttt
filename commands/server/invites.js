'use strict';

const { card, err, COLORS } = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'server';
const prefixName = 'invites';
const aliases    = ['serverinvites', 'invitelist'];

async function prefixExecute(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const invites = await message.guild.invites.fetch().catch(() => null);
  if (!invites?.size) return message.reply(err('No active invites, or I lack permission to view them.'));

  const sorted = [...invites.values()].sort((a, b) => (b.uses || 0) - (a.uses || 0)).slice(0, 15);

  return message.reply(card({
    title:  `${message.guild.name} — Invites`,
    desc:   sorted.map(i => `\`${i.code}\` — ${i.inviter?.username ?? '?'} — **${i.uses ?? 0}** use${(i.uses ?? 0) === 1 ? '' : 's'}${i.maxUses ? `/${i.maxUses}` : ''}`).join('\n'),
    color:  COLORS.blue,
    footer: `${invites.size} invite${invites.size === 1 ? '' : 's'} total`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('invites')
  .setDescription('list all active server invites')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
