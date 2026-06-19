'use strict';

const { ok, err }              = require('../../utils/components');
const { PermissionFlagsBits, ChannelType } = require('discord.js');

const category   = 'moderation';
const prefixName = 'createchannel';
const aliases    = ['cc', 'newchannel', 'makechannel'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return message.reply(err('You need the **Manage Channels** permission.'));

  const name = args[0]?.replace(/\s+/g, '-').toLowerCase();
  if (!name) return message.reply(err('Provide a channel name.'));

  const type   = args[1]?.toLowerCase() === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
  const parent = message.mentions.channels.first()?.parentId || message.channel.parentId || null;

  try {
    const ch = await message.guild.channels.create({ name, type, parent });
    message.reply(ok(`Channel ${ch} has been created.`));
  } catch (e) {
    message.reply(err(`Failed: ${e.message}`));
  }
}

const { SlashCommandBuilder, ChannelType: CT } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('createchannel')
  .setDescription('create a new text or voice channel')
  .addStringOption(o => o.setName('name').setDescription('channel name').setRequired(true))
  .addStringOption(o => o.setName('type').setDescription('channel type').addChoices(
    { name: 'Text', value: 'text' },
    { name: 'Voice', value: 'voice' },
  ))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  const name = interaction.options.getString('name');
  const type = interaction.options.getString('type') || 'text';
  try {
    const ch = await interaction.guild.channels.create({
      name,
      type: type === 'voice' ? CT.GuildVoice : CT.GuildText,
    });
    await interaction.reply(ok(`Created channel ${ch}.`));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
