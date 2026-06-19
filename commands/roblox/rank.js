'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err, loading }     = require('../../utils/components');
const { getGuild, getVerifyConfig } = require('../../utils/database');
const { getUser, rankUser, getGroupRoles } = require('../../utils/roblox');

const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('change a Roblox user\'s rank in your group')
  .addStringOption(o => o.setName('username').setDescription('Roblox username').setRequired(true))
  .addStringOption(o => o.setName('rank').setDescription('rank name or rank number').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const category   = 'roblox';
const prefixName = 'rank';
const aliases    = ['setrank', 'grouprank'];

async function execute(interaction) {
  const username  = interaction.options.getString('username');
  const rankInput = interaction.options.getString('rank');
  await interaction.deferReply();

  const guildData = getGuild(interaction.guild.id);
  if (!guildData.roblox_group_id)
    return interaction.editReply(err('No group configured — use `/setgroup` first.'));
  const groupId = guildData.roblox_group_id;
  const cookie  = getVerifyConfig(interaction.guild.id)?.cookie;

  await interaction.editReply(loading(`Ranking **${username}**...`));
  const u = await getUser(username).catch(() => null);
  if (!u) return interaction.editReply(err(`**${username}** not found on Roblox.`));

  const roles = await getGroupRoles(groupId).catch(() => null);
  if (!roles) return interaction.editReply(err('Failed to fetch group roles.'));

  const rankNum = parseInt(rankInput);
  const role    = isNaN(rankNum)
    ? roles.find(r => r.name.toLowerCase() === rankInput.toLowerCase())
    : roles.find(r => r.rank === rankNum);
  if (!role) return interaction.editReply(err(`Rank **${rankInput}** not found in the group.`));

  const result = await rankUser(groupId, u.id, role.id, cookie).catch(e => ({ error: e.message }));
  if (result?.error) return interaction.editReply(err(`Rank failed: ${result.error}`));
  await interaction.editReply(ok(`Ranked **${u.displayName ?? username}** to **${role.name}** (rank ${role.rank}).`));
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));
  const [username, rankInput] = args;
  if (!username || !rankInput) return message.reply(err('Usage: `!rank <username> <rank>`'));
  const guildData = getGuild(message.guild.id);
  if (!guildData.roblox_group_id) return message.reply(err('No group configured.'));
  const cookie = getVerifyConfig(message.guild.id)?.cookie;
  const u = await getUser(username).catch(() => null);
  if (!u) return message.reply(err(`**${username}** not found.`));
  const roles = await getGroupRoles(guildData.roblox_group_id).catch(() => null);
  if (!roles) return message.reply(err('Failed to fetch group roles.'));
  const rankNum = parseInt(rankInput);
  const role    = isNaN(rankNum)
    ? roles.find(r => r.name.toLowerCase() === rankInput.toLowerCase())
    : roles.find(r => r.rank === rankNum);
  if (!role) return message.reply(err(`Rank **${rankInput}** not found.`));
  const result = await rankUser(guildData.roblox_group_id, u.id, role.id, cookie).catch(e => ({ error: e.message }));
  if (result?.error) return message.reply(err(`Rank failed: ${result.error}`));
  await message.reply(ok(`Ranked **${u.displayName ?? username}** to **${role.name}**.`));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
