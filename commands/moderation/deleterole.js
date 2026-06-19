'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'deleterole';
const aliases    = ['dr', 'delrole', 'rmrole'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
    return message.reply(err('You need the **Manage Roles** permission.'));

  const role = message.mentions.roles.first()
    || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
  if (!role) return message.reply(err('Mention a role or provide its name.'));
  if (role.position >= message.guild.members.me.roles.highest.position)
    return message.reply(err('I cannot delete a role above my highest role.'));

  try {
    const name = role.name;
    await role.delete(`Deleted by ${message.author.tag}`);
    message.reply(ok(`Role **${name}** has been deleted.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('deleterole')
  .setDescription('delete an existing role')
  .addRoleOption(o => o.setName('role').setDescription('role to delete').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  const role = interaction.options.getRole('role');
  try {
    await role.delete();
    await interaction.reply(ok(`Deleted role **${role.name}**.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
