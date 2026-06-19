'use strict';

const { ok, err }             = require('../../utils/components');
const { addWarning }           = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'note';
const aliases    = ['addnote', 'staffnote'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member.'));

  const note = args.slice(1).join(' ');
  if (!note) return message.reply(err('Provide a note.'));

  addWarning(message.guild.id, member.id, message.author.id, `[NOTE] ${note}`);
  return message.reply(ok(`Note saved for ${member}: **${note}**`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('note')
  .setDescription('add a private moderator note to a user\'s record')
  .addUserOption(o => o.setName('user').setDescription('user to note').setRequired(true))
  .addStringOption(o => o.setName('note').setDescription('note content').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const note = interaction.options.getString('note');
  addWarning(interaction.guild.id, user.id, interaction.user.id, `[NOTE] ${note}`);
  await interaction.reply(ok(`Note added for ${user}: *${note}*`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
