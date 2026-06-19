'use strict';

const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  SectionBuilder, ThumbnailBuilder,
  ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags,
} = require('discord.js');
const { card, err, COLORS } = require('../../utils/components');
const { getUserByUsername, getUserGroups, getGroupIcon } = require('../../utils/roblox');
const { getVerifiedUser }  = require('../../utils/database');

const category   = 'roblox';
const prefixName = 'groupcheck';
const aliases    = ['gc', 'grouprank'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);
const CV2 = MessageFlags.IsComponentsV2;
const PAGE_SIZE = 3;

async function buildPage(displayName, groups, page) {
  const total = Math.ceil(groups.length / PAGE_SIZE) || 1;
  const slice = groups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Fetch all group icons for this page in parallel
  const icons = await Promise.all(
    slice.map(({ group }) => getGroupIcon(group.id, '150x150').catch(() => null))
  );

  const c = new ContainerBuilder().setAccentColor(0x000000)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${displayName}'s joined groups`))
    .addSeparatorComponents(S());

  for (let i = 0; i < slice.length; i++) {
    const { group: g, role } = slice[i];
    const icon = icons[i];

    const lines = [
      `**${g.name}**`,
      `Members · ${g.memberCount?.toLocaleString() ?? '?'}`,
      `Public · ${g.publicEntryAllowed ? 'Yes' : 'No'}`,
      `Rank · ${role?.name ?? 'Guest'}`,
      `Group ID · \`${g.id}\``,
    ].join('\n');

    if (icon) {
      c.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines))
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
      );
    } else {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines));
    }

    c.addSeparatorComponents(S(false));
  }

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# page ${page + 1} of ${total}`));

  const buttons = [];
  if (page > 0) {
    buttons.push(
      new ButtonBuilder().setCustomId(`gc_prev_${page}`).setLabel('Previous').setStyle(ButtonStyle.Secondary)
    );
  }
  if (page + 1 < total) {
    buttons.push(
      new ButtonBuilder().setCustomId(`gc_next_${page}`).setLabel('Next').setStyle(ButtonStyle.Primary)
    );
  }

  const components = [c];
  if (buttons.length) components.push(new ActionRowBuilder().addComponents(...buttons));
  return { flags: CV2, components };
}

async function prefixExecute(message, args) {
  const input = args[0];

  await message.channel.sendTyping().catch(() => {});

  let robloxId, displayName;

  const mentionedMember = message.mentions.members.first();
  if (mentionedMember) {
    const linked = getVerifiedUser(message.guild.id, mentionedMember.id);
    if (!linked) return message.reply(err(`${mentionedMember.user.username} has no linked Roblox account.`));
    robloxId    = linked.roblox_id;
    displayName = linked.roblox_name;
  } else if (input) {
    let user;
    try {
      user = /^\d+$/.test(input) ? { id: input, name: input } : await getUserByUsername(input);
    } catch {
      return message.reply(err('Failed to reach the Roblox API.'));
    }
    if (!user) return message.reply(err(`No Roblox account found for **${input}**.`));
    robloxId    = user.id;
    displayName = user.name || input;
  } else {
    const linked = getVerifiedUser(message.guild.id, message.author.id);
    if (!linked) return message.reply(err('You have no linked Roblox account. Use `.verify <username>` first.'));
    robloxId    = linked.roblox_id;
    displayName = linked.roblox_name;
  }

  let groups;
  try {
    groups = await getUserGroups(robloxId);
  } catch {
    return message.reply(err('Failed to retrieve group data.'));
  }

  if (!groups.length) {
    return message.reply(card({ title: `${displayName}'s joined groups`, desc: 'This user is not in any groups.', color: 0x000000 }));
  }

  let page = 0;
  const reply = await message.reply(await buildPage(displayName, groups, page));

  const total = Math.ceil(groups.length / PAGE_SIZE);
  if (total <= 1) return;

  const collector = reply.createMessageComponentCollector({ time: 120_000 });
  collector.on('collect', async i => {
    if (i.user.id !== message.author.id) {
      return i.reply({ ...err('Only the command author can navigate pages.'), ephemeral: true });
    }
    if (i.customId.startsWith('gc_prev_')) page--;
    if (i.customId.startsWith('gc_next_')) page++;
    page = Math.max(0, Math.min(page, total - 1));
    await i.update(await buildPage(displayName, groups, page));
  });
  collector.on('end', () => reply.edit({ components: [reply.components[0]] }).catch(() => {}));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('groupcheck')
  .setDescription("list a Roblox user's joined groups")
  .addStringOption(o => o.setName('user').setDescription('Roblox username, ID, or @mention (default: your linked account)'));

async function execute(interaction) {
  await interaction.deferReply();
  const input = interaction.options.getString('user');
  let robloxId, displayName;
  if (input) {
    const u = /^\d+$/.test(input) ? { id: input, name: input } : await getUserByUsername(input).catch(() => null);
    if (!u) return interaction.editReply(err(`**${input}** not found on Roblox.`));
    robloxId    = u.id;
    displayName = u.name || input;
  } else {
    const linked = getVerifiedUser(interaction.guild.id, interaction.user.id);
    if (!linked) return interaction.editReply(err("You don't have a linked account. Use `/verify` first."));
    robloxId    = linked.roblox_id;
    displayName = linked.roblox_name;
  }
  const groups = await getUserGroups(robloxId).catch(() => []);
  if (!groups.length) return interaction.editReply(card({ title: `${displayName}'s joined groups`, desc: 'No groups.', color: 0x000000 }));
  await interaction.editReply(await buildPage(displayName, groups, 0));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
