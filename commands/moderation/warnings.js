'use strict';

const { card, err, COLORS }  = require('../../utils/components');
const { getWarnings }         = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'warnings';
const aliases    = ['warns', 'infractions'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));

  const warns = getWarnings(message.guild.id, member.id);

  return message.reply(card({
    title: `Warnings — ${member.user.username}`,
    desc:  warns.length
      ? warns.map((w, i) => `**#${i + 1}** ${w.reason} — <@${w.mod_id}> <t:${w.created_at}:R>`).join('\n')
      : 'No warnings on record.',
    color: warns.length ? COLORS.yellow : COLORS.green,
    footer: `${warns.length} warning${warns.length === 1 ? '' : 's'} total`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('list all active warnings for a user')
  .addUserOption(o => o.setName('user').setDescription('user to check').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user  = interaction.options.getUser('user');
  const warns = getWarnings(interaction.guild.id, user.id);
  if (!warns.length) return interaction.reply(ok(`**${user.username}** has no warnings.`));
  const list = warns.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.timestamp / 1000)}:R>`).join('\n');
  await interaction.reply(card({ title: `Warnings — ${user.username}`, desc: list, color: COLORS.orange }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
