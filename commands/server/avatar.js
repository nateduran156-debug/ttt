'use strict';

const { card, err, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'avatar';
const aliases    = ['av', 'pfp', 'icon'];

async function prefixExecute(message, args) {
  const user = message.mentions.users.first() || message.author;
  const url  = user.displayAvatarURL({ size: 1024, extension: 'png' });

  return message.reply(card({
    title: `${user.username}'s avatar`,
    color: COLORS.blue,
    image: url,
    footer: url,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('get a user\'s avatar as a full-size image')
  .addUserOption(o => o.setName('user').setDescription('user to get avatar for (default: yourself)'));

async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const url  = user.displayAvatarURL({ size: 1024, extension: 'png' });
  await interaction.reply(card({ title: `${user.username}'s Avatar`, color: COLORS.blue, image: url }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
