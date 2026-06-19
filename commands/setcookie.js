'use strict';

const { setVerifyConfig } = require('../utils/database');
const { ok, err }          = require('../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'all';
const prefixName = 'setcookie';
const aliases    = ['cookie'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
    return message.reply(err('You need the **Administrator** permission.'));

  const cookie = args[0];
  if (!cookie) return message.reply(err('Provide the Roblox security cookie.'));

  setVerifyConfig(message.guild.id, { cookie });
  await message.delete().catch(() => {});
  return message.channel.send(ok('Cookie stored. The message containing it has been deleted.'));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('setcookie')
  .setDescription('store the Roblox security cookie used for group actions (admin only)')
  .addStringOption(o => o.setName('cookie').setDescription('.ROBLOSECURITY cookie value').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  const cookie = interaction.options.getString('cookie');
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
    return interaction.reply({ ...err('You need the **Administrator** permission.'), ephemeral: true });
  setVerifyConfig(interaction.guild.id, { cookie });
  await interaction.reply({ ...ok('Cookie stored securely.'), ephemeral: true });
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
