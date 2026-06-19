'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'removerole';
const aliases    = ['rr', 'takerole', 'delrole'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
    return message.reply(err('You need the **Manage Roles** permission.'));

  const member = message.mentions.members.first();
  const role   = message.mentions.roles.first();

  if (!member || !role) return message.reply(err('Mention a member and a role.'));
  if (role.position >= message.member.roles.highest.position)
    return message.reply(err('You cannot remove a role equal to or above your highest role.'));

  try {
    await member.roles.remove(role);
    message.reply(ok(`${role} has been removed from ${member}.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('removerole')
  .setDescription('remove a role from a specific member')
  .addUserOption(o => o.setName('user').setDescription('member to remove the role from').setRequired(true))
  .addRoleOption(o => o.setName('role').setDescription('role to remove').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const role   = interaction.options.getRole('role');
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('Member not found.'));
  try {
    await member.roles.remove(role);
    await interaction.reply(ok(`Removed ${role} from ${user}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
