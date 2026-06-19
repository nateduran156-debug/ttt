'use strict';

const { card, err, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'banner';
const aliases    = ['userbanner'];

async function prefixExecute(message, args) {
  const user   = await (message.mentions.users.first() || message.author).fetch();
  const banner = user.bannerURL({ size: 1024 });

  if (!banner) return message.reply(err(`**${user.username}** does not have a profile banner.`));

  return message.reply(card({
    title: `${user.username}'s banner`,
    color: user.accentColor ?? COLORS.blue,
    image: banner,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('show the server banner image');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
