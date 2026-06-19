'use strict';

const { card, err, COLORS }   = require('../../utils/components');
const { getGroupInfo, getGroupIcon } = require('../../utils/roblox');

const category   = 'roblox';
const prefixName = 'groupinfo';
const aliases    = ['group', 'gi'];

async function prefixExecute(message, args) {
  const groupId = args[0];
  if (!groupId) return message.reply(err('Provide a Roblox group ID.'));

  await message.channel.sendTyping().catch(() => {});

  let group;
  try {
    group = await getGroupInfo(groupId);
  } catch {
    return message.reply(err('Group not found or API unavailable.'));
  }

  const icon = await getGroupIcon(groupId).catch(() => null);

  return message.reply(card({
    title:  group.name,
    fields: [
      { name: 'ID',          value: `\`${group.id}\`` },
      { name: 'Members',     value: `${group.memberCount?.toLocaleString()}` },
      { name: 'Owner',       value: group.owner?.username ?? 'None' },
      { name: 'Public',      value: group.publicEntryAllowed ? 'Yes' : 'No' },
      { name: 'Description', value: group.description?.slice(0, 200) || 'None' },
    ],
    color:  COLORS.teal,
    image:  icon,
    footer: `https://www.roblox.com/groups/${group.id}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('groupinfo')
  .setDescription('show info about a Roblox group')
  .addStringOption(o => o.setName('groupid').setDescription('Roblox group ID (default: server\'s group)'));

async function execute(interaction) {
  const groupId = interaction.options.getString('groupid');
  await interaction.deferReply();
  const g = await getGroupInfo(groupId).catch(() => null);
  if (!g) return interaction.editReply(err(`Group **${groupId}** not found.`));
  const icon = await getGroupIcon(groupId).catch(() => null);
  await interaction.editReply(card({
    title:  g.name,
    desc:   g.description?.slice(0, 300) || 'No description.',
    fields: [
      { name: 'Members',  value: g.memberCount?.toLocaleString() ?? '?', inline: true },
      { name: 'Owner',    value: g.owner?.displayName ?? 'Unknown',       inline: true },
      { name: 'ID',       value: String(g.id),                            inline: true },
    ],
    color: COLORS.teal,
    image: icon || undefined,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
