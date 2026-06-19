'use strict';

const { card, err, COLORS }  = require('../../utils/components');
const { getWarnings }         = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'history';
const aliases    = ['modhistory', 'mh'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to view their history.'));

  const warns = getWarnings(message.guild.id, member.id);

  return message.reply(card({
    title: `Mod History — ${member.user.username}`,
    desc:  warns.length
      ? warns.map((w, i) => `\`#${i + 1}\` **Warn** — ${w.reason} — <@${w.mod_id}> <t:${w.created_at}:R>`).join('\n')
      : 'No recorded infractions.',
    color: warns.length ? COLORS.yellow : COLORS.green,
    footer: `${warns.length} action${warns.length === 1 ? '' : 's'} total`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('history')
  .setDescription('view full moderation history for a user')
  .addUserOption(o => o.setName('user').setDescription('user to check').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user  = interaction.options.getUser('user');
  const warns = getWarnings(interaction.guild.id, user.id);
  if (!warns.length) return interaction.reply(ok(`**${user.username}** has a clean record.`));
  const list  = warns.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.timestamp / 1000)}:R> by <@${w.mod_id}>`).join('\n');
  await interaction.reply(card({ title: `Mod History — ${user.username}`, desc: list.slice(0, 4000), color: COLORS.red }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
