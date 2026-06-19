'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { err } = require('../../utils/components');
const {
  getUserByUsername, getUserById,
  getHeadshot, getAvatarThumbnail, getDominantColor,
} = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'roblox';
const aliases    = ['rb', 'rblx', 'lookup'];

async function buildRobloxEmbed(user) {
  const [headshot, bodyShot] = await Promise.all([
    getHeadshot(user.id, '420x420').catch(() => null),
    getAvatarThumbnail(user.id, '420x420').catch(() => null),
  ]);

  // Extract dominant outfit colour from the full-body render
  const color = bodyShot ? await getDominantColor(bodyShot) : 0x000000;

  const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;

  const embed = new EmbedBuilder()
    .setColor(color)
    // Author line = white clickable username
    .setAuthor({ name: user.name, url: profileUrl })
    // Display name as title (no URL so it stays white/plain)
    .setTitle(user.displayName !== user.name ? user.displayName : null)
    .setDescription(user.description?.slice(0, 300) || null)
    // Headshot in the top-right corner
    .setThumbnail(headshot)
    .addFields(
      { name: 'ID',      value: `\`${user.id}\``,                                                                        inline: true },
      { name: 'Created', value: `<t:${Math.floor(new Date(user.created).getTime() / 1000)}:D>`,                          inline: true },
      { name: 'Verified',value: user.hasVerifiedBadge ? '✅ Yes' : 'No',                                                inline: true },
    )
    .setFooter({ text: 'roblox.com', iconURL: 'https://www.roblox.com/favicon.ico' });

  return { embeds: [embed] };
}

async function prefixExecute(message, args) {
  const input = args[0];
  if (!input) return message.reply(err('Provide a Roblox username or ID.'));

  await message.channel.sendTyping().catch(() => {});

  let user;
  try {
    user = /^\d+$/.test(input)
      ? await getUserById(input)
      : await getUserById((await getUserByUsername(input))?.id);
  } catch {
    return message.reply(err('Failed to reach the Roblox API. Please try again later.'));
  }

  if (!user) return message.reply(err(`No Roblox account found for **${input}**.`));

  return message.reply(await buildRobloxEmbed(user));
}

const data = new SlashCommandBuilder()
  .setName('roblox')
  .setDescription('look up a Roblox user — profile, avatar, outfit colour')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  await interaction.deferReply();
  const input = interaction.options.getString('user');

  let user;
  try {
    user = /^\d+$/.test(input)
      ? await getUserById(input)
      : await getUserById((await getUserByUsername(input))?.id);
  } catch {
    return interaction.editReply(err(`Failed to reach the Roblox API.`));
  }

  if (!user) return interaction.editReply(err(`**${input}** not found on Roblox.`));

  return interaction.editReply(await buildRobloxEmbed(user));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
