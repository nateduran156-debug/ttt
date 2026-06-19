'use strict';

const { ok, err }              = require('../../utils/components');
const { PermissionFlagsBits, ChannelType } = require('discord.js');

const category   = 'moderation';
const prefixName = 'lockall';
const aliases    = ['serverlock', 'lockserver'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
    return message.reply(err('You need the **Administrator** permission.'));

  const reason   = args.join(' ') || 'Server lockdown';
  const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  let locked     = 0;

  for (const [, ch] of channels) {
    await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: false }, { reason })
      .then(() => locked++)
      .catch(() => {});
  }

  message.reply(ok(`🔒 Locked **${locked}** channels — **${reason}**`));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('lockall')
  .setDescription('lock every text channel in the server')
  .addStringOption(o => o.setName('reason').setDescription('reason for the server lockdown'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const reason = interaction.options.getString('reason') || 'Server lockdown';
  await interaction.deferReply();
  const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.permissionsFor(interaction.guild.roles.everyone)?.has('SendMessages'));
  let locked = 0;
  for (const [, ch] of channels) {
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    locked++;
  }
  await interaction.editReply(ok(`🔒 Locked **${locked}** channel(s). Reason: ${reason}`));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
