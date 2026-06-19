'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'nick';
const aliases    = ['nickname', 'setnick'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames))
    return message.reply(err('You need the **Manage Nicknames** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));

  const nick = args.slice(1).join(' ') || null;

  try {
    await member.setNickname(nick);
    return message.reply(ok(nick ? `Nickname for ${member} set to **${nick}**.` : `Nickname cleared for ${member}.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('nick')
  .setDescription('change or reset a member\'s nickname')
  .addUserOption(o => o.setName('user').setDescription('member to nickname').setRequired(true))
  .addStringOption(o => o.setName('nickname').setDescription('new nickname (leave blank to reset)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const nick   = interaction.options.getString('nickname') ?? null;
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('Member not found.'));
  try {
    await member.setNickname(nick);
    await interaction.reply(ok(nick ? `Set nickname for ${user} to **${nick}**.` : `Reset nickname for ${user}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
