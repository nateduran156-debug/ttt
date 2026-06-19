'use strict';

const { card, err, COLORS }          = require('../../utils/components');
const { getUserByUsername, getUserById, getUserPresence, getGameInfo } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'presence';
const aliases    = ['online', 'status', 'robloxstatus'];

async function prefixExecute(message, args) {
  const input = args[0];
  if (!input) return message.reply(err('Provide a Roblox username or ID.'));

  await message.channel.sendTyping().catch(() => {});

  let user;
  try {
    user = /^\d+$/.test(input) ? await getUserById(input) : await getUserByUsername(input);
    if (!user) return message.reply(err(`No account found for **${input}**.`));
  } catch {
    return message.reply(err('Failed to reach the Roblox API.'));
  }

  const userId = user.id ?? user.id;
  const [presence] = await getUserPresence([Number(userId)]).catch(() => [null]);
  if (!presence) return message.reply(err('Could not retrieve presence data.'));

  let statusDesc;
  let gameInfo = null;

  switch (presence.userPresenceType) {
    case 0: statusDesc = '🔴 Offline'; break;
    case 1: statusDesc = '🌐 Online (Website)'; break;
    case 2: {
      statusDesc = `🎮 In Game — ${presence.lastLocation || 'Unknown'}`;
      if (presence.universeId) {
        gameInfo = await getGameInfo(presence.universeId).catch(() => null);
        if (gameInfo) statusDesc = `🎮 In **${gameInfo.name}**`;
      }
      break;
    }
    case 3: statusDesc = `🔧 In Studio — ${presence.lastLocation || 'Unknown'}`; break;
    default: statusDesc = 'Unknown';
  }

  return message.reply(card({
    title:  user.name || user.displayName,
    desc:   statusDesc,
    color:  presence.userPresenceType >= 1 ? COLORS.green : COLORS.gray,
    footer: `Last seen: ${presence.lastOnline ? new Date(presence.lastOnline).toUTCString() : 'Unknown'}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('presence')
  .setDescription('check if a Roblox user is currently online and what they are playing')
  .addStringOption(o => o.setName('user').setDescription('Roblox username or ID').setRequired(true));

async function execute(interaction) {
  const input = interaction.options.getString('user');
  await interaction.deferReply();
  const u = isNaN(input) ? await getUserByUsername(input).catch(() => null) : await getUserById(input).catch(() => null);
  if (!u) return interaction.editReply(err(`**${input}** not found.`));
  const p = await getUserPresence(u.id).catch(() => null);
  const statusMap = { 0: '⚫ Offline', 1: '🟢 Online (Website)', 2: '🎮 In-Game', 3: '🔧 In Studio' };
  const status = statusMap[p?.userPresenceType] ?? '⚫ Offline';
  let gameName = '';
  if (p?.placeId) {
    const g = await getGameInfo(p.placeId).catch(() => null);
    if (g) gameName = `\nPlaying: **${g.name}**`;
  }
  await interaction.editReply(card({
    title: `Presence — ${u.displayName}`,
    desc:  `${status}${gameName}`,
    color: COLORS.teal,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
