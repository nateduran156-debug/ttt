'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err }       = require('../../utils/components');
const { updateGuild }   = require('../../utils/database');
const { getGroup }      = require('../../utils/roblox');

const data = new SlashCommandBuilder()
  .setName('setgroup')
  .setDescription('link a Roblox group to this server')
  .addStringOption(o => o.setName('groupid').setDescription('Roblox group ID').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const category   = 'roblox';
const prefixName = 'setgroup';
const aliases    = ['linkgroup', 'sg'];

async function execute(interaction) {
  const groupId = interaction.options.getString('groupid');
  await interaction.deferReply();
  const g = await getGroup(groupId).catch(() => null);
  if (!g) return interaction.editReply(err(`Group **${groupId}** not found.`));
  updateGuild(interaction.guild.id, { roblox_group_id: groupId });
  await interaction.editReply(ok(`Roblox group set to **${g.name}** (\`${groupId}\`).`));
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));
  const groupId = args[0];
  if (!groupId) return message.reply(err('Provide a group ID.'));
  const g = await getGroup(groupId).catch(() => null);
  if (!g) return message.reply(err(`Group **${groupId}** not found.`));
  updateGuild(message.guild.id, { roblox_group_id: groupId });
  await message.reply(ok(`Roblox group set to **${g.name}**.`));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
