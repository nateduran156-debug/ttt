'use strict';

const { ok, err }             = require('../../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'nuke';
const aliases    = ['clearchannel'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const ch = message.channel;

  try {
    const clone = await ch.clone({ reason: `Nuked by ${message.author.tag}` });
    await ch.delete();
    clone.send(ok(`💥 Channel nuked by ${message.author}.`));
  } catch (e) {
    message.reply(err(`Nuke failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('nuke')
  .setDescription('clone and delete this channel (clears all messages)')
  .addStringOption(o => o.setName('reason').setDescription('reason'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const reason = interaction.options.getString('reason') || 'Nuke';
  try {
    const ch     = interaction.channel;
    const pos    = ch.position;
    const cloned = await ch.clone({ reason });
    await cloned.setPosition(pos);
    await ch.delete(reason);
    await cloned.send(ok(`This channel was nuked by ${interaction.user}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
