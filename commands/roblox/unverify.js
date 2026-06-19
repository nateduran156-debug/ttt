'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { ok, err }             = require('../../utils/components');
const { getUser, unlinkUser } = require('../../utils/database');

const data = new SlashCommandBuilder()
  .setName('unverify')
  .setDescription('unlink your Roblox account from Discord');

const category   = 'roblox';
const prefixName = 'unverify';
const aliases    = ['unlink', 'unverifyme'];

async function execute(interaction) {
  const linked = getUser(interaction.guild.id, interaction.user.id);
  if (!linked) return interaction.reply(err('You don\'t have a linked Roblox account.'));
  unlinkUser(interaction.user.id, interaction.guild.id);
  await interaction.reply(ok('Your Roblox account has been unlinked.'));
}

async function prefixExecute(message) {
  const linked = getUser(message.guild.id, message.author.id);
  if (!linked) return message.reply(err('You don\'t have a linked Roblox account.'));
  unlinkUser(message.author.id, message.guild.id);
  await message.reply(ok('Your Roblox account has been unlinked.'));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
