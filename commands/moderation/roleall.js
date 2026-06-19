'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'roleall';
const aliases    = ['massrole', 'giveroleall'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
    return message.reply(err('You need the **Manage Roles** permission.'));

  const role = message.mentions.roles.first();
  if (!role) return message.reply(err('Mention a role to give to all members.'));
  if (role.position >= message.member.roles.highest.position)
    return message.reply(err('You cannot assign a role equal to or above your highest role.'));

  const members = await message.guild.members.fetch();
  let given = 0;

  for (const [, m] of members) {
    if (!m.roles.cache.has(role.id)) {
      await m.roles.add(role).then(() => given++).catch(() => {});
    }
  }

  message.reply(ok(`Gave ${role} to **${given}** member(s).`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('roleall')
  .setDescription('give a role to every member in the server')
  .addRoleOption(o => o.setName('role').setDescription('role to assign').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  const role = interaction.options.getRole('role');
  await interaction.deferReply();
  const members = await interaction.guild.members.fetch();
  let done = 0, failed = 0;
  for (const [, m] of members) {
    if (m.roles.cache.has(role.id)) continue;
    await m.roles.add(role).then(() => done++).catch(() => failed++);
    await new Promise(r => setTimeout(r, 100));
  }
  await interaction.editReply(ok(`Gave ${role} to **${done}** member(s)${failed ? `, ${failed} failed` : ''}.`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
