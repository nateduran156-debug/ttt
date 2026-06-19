'use strict';

const { card, err, COLORS }  = require('../../utils/components');
const { getVerifiedUser }     = require('../../utils/database');

const category   = 'roblox';
const prefixName = 'linked';
const aliases    = ['myaccount', 'whoami'];

async function prefixExecute(message, args) {
  const target = message.mentions.users.first() || message.author;
  const linked = getVerifiedUser(message.guild.id, target.id);

  if (!linked) return message.reply(err(`${target.username} has no linked Roblox account.`));

  return message.reply(card({
    title:  `${target.username}'s Linked Account`,
    desc:   `**Username** ${linked.roblox_name}\n**ID** \`${linked.roblox_id}\`\n**Verified** <t:${linked.verified_at}:R>`,
    color:  COLORS.green,
    footer: `https://www.roblox.com/users/${linked.roblox_id}/profile`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('linked')
  .setDescription('check which Roblox account a Discord user is linked to')
  .addUserOption(o => o.setName('user').setDescription('user to check (default: yourself)'));

async function execute(interaction) {
  const target = interaction.options.getUser('user') || interaction.user;
  const linked = getVerifiedUser(interaction.guild.id, target.id);
  if (!linked) return interaction.reply(err(`${target} has no linked Roblox account.`));
  await interaction.reply(card({
    title: `Linked Account — ${target.username}`,
    desc:  `**Roblox:** [${linked.roblox_name}](https://www.roblox.com/users/${linked.roblox_id}/profile)\n**Roblox ID:** \`${linked.roblox_id}\``,
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
