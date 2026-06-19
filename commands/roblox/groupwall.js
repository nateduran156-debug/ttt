'use strict';

const { card, err, COLORS } = require('../../utils/components');
const { getGroupWall }       = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'groupwall';
const aliases    = ['gwall', 'wall'];

async function prefixExecute(message, args) {
  const groupId = args[0];
  if (!groupId) return message.reply(err('Provide a Roblox group ID.'));

  await message.channel.sendTyping().catch(() => {});

  let posts;
  try {
    posts = await getGroupWall(groupId, 5);
  } catch {
    return message.reply(err('Failed to retrieve the group wall.'));
  }

  if (!posts.length) return message.reply(err('The group wall is empty or this group does not have a public wall.'));

  const lines = posts.map((p, i) =>
    `**${i + 1}.** **${p.poster?.user?.username ?? 'Unknown'}** — ${p.body?.slice(0, 120) ?? '*(no content)*'}`
  );

  return message.reply(card({
    title: `Group Wall — ${groupId}`,
    desc:  lines.join('\n\n'),
    color: COLORS.teal,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('groupwall')
  .setDescription('view recent Roblox group wall posts')
  .addStringOption(o => o.setName('groupid').setDescription('Roblox group ID (default: server\'s group)'));

async function execute(interaction) {
  const groupId = interaction.options.getString('groupid');
  await interaction.deferReply();
  const posts = await getGroupWall(groupId).catch(() => null);
  if (!posts?.length) return interaction.editReply(err(`No wall posts found for group **${groupId}**.`));
  await interaction.editReply(card({
    title: `Group Wall — ${groupId}`,
    desc:  posts.slice(0, 5).map(p => `**${p.poster?.displayName ?? 'Unknown'}:** ${p.body?.slice(0, 100) ?? ''}`).join('\n'),
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
