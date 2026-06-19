'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'createrole';
const aliases    = ['cr', 'newrole', 'makerole'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
    return message.reply(err('You need the **Manage Roles** permission.'));

  const name  = args.join(' ');
  if (!name) return message.reply(err('Provide a role name.'));

  try {
    const role = await message.guild.roles.create({ name, reason: `Created by ${message.author.tag}` });
    message.reply(ok(`Role ${role} has been created.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('createrole')
  .setDescription('create a new role')
  .addStringOption(o => o.setName('name').setDescription('role name').setRequired(true))
  .addStringOption(o => o.setName('color').setDescription('hex color e.g. #FF0000'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  const name  = interaction.options.getString('name');
  const color = interaction.options.getString('color') || null;
  try {
    const role = await interaction.guild.roles.create({ name, color: color || undefined });
    await interaction.reply(ok(`Created role ${role}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
