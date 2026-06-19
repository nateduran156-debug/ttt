'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err }                    = require('../../utils/components');
const { getGuild, getVerifyConfig }  = require('../../utils/database');
const { setGroupShout }              = require('../../utils/roblox');

const data = new SlashCommandBuilder()
  .setName('shout')
  .setDescription('update your Roblox group shout')
  .addStringOption(o => o.setName('message').setDescription('shout message').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const category   = 'roblox';
const prefixName = 'shout';
const aliases    = ['groupshout', 'gs'];

async function execute(interaction) {
  const guildData = getGuild(interaction.guild.id);
  if (!guildData.roblox_group_id)
    return interaction.reply(err('No group configured — use `/setgroup` first.'));
  const msg    = interaction.options.getString('message');
  const cookie = getVerifyConfig(interaction.guild.id)?.cookie;
  await interaction.deferReply();
  const result = await setGroupShout(guildData.roblox_group_id, msg, cookie).catch(e => ({ error: e.message }));
  if (result?.error) return interaction.editReply(err(`Shout failed: ${result.error}`));
  await interaction.editReply(ok(`Group shout updated: *${msg}*`));
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));
  const guildData = getGuild(message.guild.id);
  if (!guildData.roblox_group_id) return message.reply(err('No group configured.'));
  const msg = args.join(' ');
  if (!msg) return message.reply(err('Provide a shout message.'));
  const cookie = getVerifyConfig(message.guild.id)?.cookie;
  const result = await setGroupShout(guildData.roblox_group_id, msg, cookie).catch(e => ({ error: e.message }));
  if (result?.error) return message.reply(err(`Shout failed: ${result.error}`));
  await message.reply(ok(`Shout updated: *${msg}*`));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
