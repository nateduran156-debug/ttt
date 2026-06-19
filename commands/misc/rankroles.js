'use strict';

const { getRankRoles, addRankRole, removeRankRole } = require('../../utils/rankroles');
const { ok, err, card, COLORS }                     = require('../../utils/components');
const { PermissionFlagsBits }                        = require('discord.js');

const category   = 'misc';
const prefixName = 'rankroles';
const aliases    = ['rankrole', 'rr'];

function listPayload(guildId) {
  const roles = getRankRoles(guildId);
  if (!roles.length) return err('No rank roles configured. Use `.rankroles add @role <threshold>` to add one.');
  return card({
    title: '⭐ Rank Roles',
    desc:  roles.map(r => `<@&${r.role_id}> — **${r.threshold}** points`).join('\n'),
    color: COLORS.gold,
  });
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission to configure rank roles.'));

  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();

  if (sub === 'add') {
    const role      = message.mentions.roles.first();
    const threshold = parseInt(args[2]);
    if (!role || isNaN(threshold)) return message.reply(err('Usage: `.rankroles add @role <threshold>`'));
    addRankRole(guildId, role.id, threshold);
    return message.reply(ok(`${role} will be automatically assigned when a member reaches **${threshold}** rank points.`));
  }

  if (sub === 'remove' || sub === 'delete') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('Mention a role to remove.'));
    const res = removeRankRole(guildId, role.id);
    if (!res.changes) return message.reply(err(`${role} has no configured rank threshold.`));
    return message.reply(ok(`Rank role threshold removed for ${role}.`));
  }

  return message.reply(listPayload(guildId));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('rankroles')
  .setDescription('manage roles automatically granted at rank point thresholds')
  .addSubcommand(s => s
    .setName('add')
    .setDescription('add a rank role reward')
    .addIntegerOption(o => o.setName('points').setDescription('rank points threshold').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('role to grant').setRequired(true)))
  .addSubcommand(s => s
    .setName('remove')
    .setDescription('remove a rank role reward')
    .addRoleOption(o => o.setName('role').setDescription('role to remove').setRequired(true)))
  .addSubcommand(s => s.setName('list').setDescription('list all rank role rewards'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'add') {
    const points = interaction.options.getInteger('points');
    const role   = interaction.options.getRole('role');
    addRankRole(interaction.guild.id, points, role.id);
    return interaction.reply(ok(`Rank role added: **${points}** points → ${role}`));
  }
  if (sub === 'remove') {
    const role = interaction.options.getRole('role');
    removeRankRole(interaction.guild.id, role.id);
    return interaction.reply(ok(`Rank role for ${role} removed.`));
  }
  if (sub === 'list') return interaction.reply(listPayload(interaction.guild.id));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
