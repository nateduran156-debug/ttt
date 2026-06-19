'use strict';

const { card, err, COLORS }          = require('../../utils/components');
const { getUserByUsername, getUserOutfits, getAvatarThumbnail } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'outfit';
const aliases    = ['avatar', 'avatarlook'];

async function prefixExecute(message, args) {
  const input = args[0];
  if (!input) return message.reply(err('Provide a Roblox username or ID.'));

  await message.channel.sendTyping().catch(() => {});

  let user;
  try {
    user = /^\d+$/.test(input) ? { id: input, name: input } : await getUserByUsername(input);
  } catch {
    return message.reply(err('Failed to reach the Roblox API.'));
  }
  if (!user) return message.reply(err(`No account found for **${input}**.`));

  const thumbnail = await getAvatarThumbnail(user.id).catch(() => null);

  return message.reply(card({
    title:  `${user.name ?? input}'s Avatar`,
    color:  COLORS.teal,
    image:  thumbnail,
    footer: thumbnail ? '' : 'Avatar thumbnail unavailable.',
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('outfit')
  .setDescription('preview a Roblox user\'s current outfit / avatar look')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u = isNaN(input) ? await getUserByUsername(input).catch(() => null) : { id: input, name: input };
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const img = await getAvatarThumbnail(u.id).catch(() => null);
  await interaction.editReply(card({
    title:  `Outfit — ${u.name ?? input}`,
    color:  COLORS.teal,
    image:  img || undefined,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
