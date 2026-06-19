'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err } = require('../../utils/components');

const data = new SlashCommandBuilder()
  .setName('setperms')
  .setDescription('set view/send permissions for a role in a channel')
  .addChannelOption(o => o.setName('channel').setDescription('target channel').setRequired(true))
  .addRoleOption(o => o.setName('role').setDescription('role to modify').setRequired(true))
  .addBooleanOption(o => o.setName('view').setDescription('can view channel'))
  .addBooleanOption(o => o.setName('send').setDescription('can send messages'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

const category   = 'moderation';
const prefixName = 'setperms';
const aliases    = ['perms', 'channelperms'];

async function execute(interaction) {
  const ch   = interaction.options.getChannel('channel');
  const role = interaction.options.getRole('role');
  const view = interaction.options.getBoolean('view');
  const send = interaction.options.getBoolean('send');
  const overwrite = {};
  if (view !== null) overwrite.ViewChannel   = view;
  if (send !== null) overwrite.SendMessages  = send;
  if (!Object.keys(overwrite).length)
    return interaction.reply(err('Provide at least one permission to set.'));
  try {
    await ch.permissionOverwrites.edit(role, overwrite);
    await interaction.reply(ok(`Updated permissions for ${role} in ${ch}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
    return message.reply(err('You need the **Manage Roles** permission.'));
  const ch   = message.mentions.channels.first();
  const role = message.mentions.roles.first();
  if (!ch || !role) return message.reply(err('Mention a channel and a role.'));
  const flag     = args.find(a => ['view', 'send', 'all', 'none'].includes(a));
  const overwrite = flag === 'view' ? { ViewChannel: true }
    : flag === 'send' ? { SendMessages: true }
    : flag === 'none' ? { ViewChannel: false, SendMessages: false }
    : { ViewChannel: true, SendMessages: true };
  try {
    await ch.permissionOverwrites.edit(role, overwrite);
    await message.reply(ok(`Updated permissions for ${role} in ${ch}.`));
  } catch (e) {
    await message.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
