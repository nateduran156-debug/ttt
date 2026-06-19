'use strict';

const { ok, err }              = require('../../utils/components');
const { PermissionFlagsBits, ChannelType } = require('discord.js');

const category   = 'moderation';
const prefixName = 'unlockall';
const aliases    = ['serverunlock', 'unlockserver'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
    return message.reply(err('You need the **Administrator** permission.'));

  const reason   = args.join(' ') || 'Server lockdown lifted';
  const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  let unlocked   = 0;

  for (const [, ch] of channels) {
    await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: null }, { reason })
      .then(() => unlocked++)
      .catch(() => {});
  }

  message.reply(ok(`🔓 Unlocked **${unlocked}** channels.`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('unlockall')
  .setDescription('unlock all previously locked channels')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  await interaction.deferReply();
  const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
  let unlocked = 0;
  for (const [, ch] of channels) {
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(() => {});
    unlocked++;
  }
  await interaction.editReply(ok(`🔓 Unlocked **${unlocked}** channel(s).`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
