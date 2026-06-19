'use strict';

const { card, err, COLORS }              = require('../../utils/components');
const { getUserByUsername, getUserFriends, getFriendCount } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'friends';
const aliases    = ['friendlist', 'rf'];

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

  const [friends, count] = await Promise.all([
    getUserFriends(user.id).catch(() => []),
    getFriendCount(user.id).catch(() => 0),
  ]);

  const preview = friends.slice(0, 10).map(f => f.name).join(', ');

  return message.reply(card({
    title:  `${user.name ?? input}'s Friends`,
    desc:   count === 0 ? 'No public friends.' : `${preview}${count > 10 ? ` *…and ${count - 10} more*` : ''}`,
    color:  COLORS.teal,
    footer: `${count} friend${count === 1 ? '' : 's'} total`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('friends')
  .setDescription('show a Roblox user\'s friends list')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u       = isNaN(input) ? await getUserByUsername(input).catch(() => null) : { id: input, name: input };
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const count   = await getFriendCount(u.id).catch(() => null);
  const friends = await getUserFriends(u.id).catch(() => null);
  if (!friends) return interaction.editReply(err('Could not fetch friends.'));
  const names = friends.slice(0, 10).map(f => `[${f.displayName}](https://www.roblox.com/users/${f.id}/profile)`).join(', ');
  await interaction.editReply(card({
    title:  `Friends — ${u.name ?? input}`,
    desc:   names || 'No friends.',
    color:  COLORS.teal,
    footer: count != null ? `${count} total friends` : undefined,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
