'use strict';

const {
  getTicket, closeTicket, openTicket,
  getTicketConfig, getTagManagers, getVerifyConfig,
} = require('../utils/database');
const { isWhitelisted } = require('../utils/whitelist');
const { ok, err, COLORS } = require('../utils/components');
const {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, ModalBuilder, TextInputBuilder, TextInputStyle,
  MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  SectionBuilder, ThumbnailBuilder,
} = require('discord.js');
const {
  getUserByUsername, getUserGroups, getUserRankInGroup, getHeadshot, getGroupIcon,
  getGroupRoles, rankUser, acceptJoinRequest,
} = require('../utils/roblox');

const CV2    = MessageFlags.IsComponentsV2;
const ACCENT = 0x000000;

const VERIFY_GROUP_ID   = '396910998';
const VERIFY_GROUP_LINK = 'https://www.roblox.com/communities/396910998';

const PAGE_SIZE = 3;

const S = (d = true) =>
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

const HARDCODED_TAG_ADMINS = ['1456824205545967713', '1511593106305450107', '1447017801360474143'];

const TAG_CHOICES = [
  { label: 'rockstar',      value: 'rockstar'      },
  { label: 'Fraid',         value: 'fraid'         },
  { label: 'FaZe',          value: 'faze'           },
  { label: 'dark',          value: 'dark'           },
  { label: 'sharingan tag', value: 'sharingan tag'  },
];

const TAG_MAP = {
  'rockstar':     { groupId: '396910998', roleName: 'rockstar'      },
  'fraid':        { groupId: '396910998', roleName: 'Fraid'         },
  'faze':         { groupId: '396910998', roleName: 'FaZe'          },
  'dark':         { groupId: '396910998', roleName: 'dark'          },
  'sharingan tag':{ groupId: '396910998', roleName: 'sharingan tag' },
};

const ticketGroupsCache = new Map();

function isFullyWhitelisted(member, guildId) {
  if (HARDCODED_TAG_ADMINS.includes(member.id)) return true;
  if (isWhitelisted(member, 'tickets')) return true;
  if (isWhitelisted(member, 'tags')) return true;
  const wl = getTagManagers(guildId);
  if (wl.users.includes(member.id)) return true;
  for (const roleId of member.roles.cache.keys()) {
    if (wl.roles.includes(roleId)) return true;
  }
  return false;
}

function isVmrOrWhitelisted(member, guildId, cfg) {
  if (isFullyWhitelisted(member, guildId)) return true;
  if (cfg?.vmr_role && member.roles.cache.has(cfg.vmr_role)) return true;
  return false;
}

async function buildTicketGcPage(robloxUser, groups, page, headshot = null) {
  const total = Math.ceil(groups.length / PAGE_SIZE) || 1;
  const slice = groups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const icons = await Promise.all(
    slice.map(({ group: g }) => getGroupIcon(g.id, '150x150').catch(() => null))
  );

  const c = new ContainerBuilder().setAccentColor(ACCENT);

  if (page === 0 && headshot) {
    c.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `## ${robloxUser.name}'s groups`
        ))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(headshot))
    );
  } else {
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `## ${robloxUser.name}'s groups`
    ));
  }
  c.addSeparatorComponents(S());

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

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `-# page ${page + 1} of ${total} · /fazee`
  ));

  const buttons = [];
  if (page > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`ticket_gc_prev_${page}`)
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (page + 1 < total) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`ticket_gc_next_${page}`)
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
    );
  }

  const components = [c];
  if (buttons.length) components.push(new ActionRowBuilder().addComponents(...buttons));
  return { flags: CV2, components };
}

async function showTicketModal(interaction, ticketType) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${ticketType}`)
    .setTitle('Open a Ticket');

  const usernameInput = new TextInputBuilder()
    .setCustomId('roblox_username')
    .setLabel('Your Roblox Username')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your exact Roblox username')
    .setRequired(true)
    .setMaxLength(20);

  modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction, client) {
  const customId   = interaction.customId;
  const ticketType = customId.replace('ticket_modal_', '');
  const robloxName = interaction.fields.getTextInputValue('roblox_username').trim();

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const user  = interaction.user;
  const cfg   = getTicketConfig(guild.id);

  const namePrefix = ticketType === 'tag' ? 'tag' : ticketType === 'verify' ? 'verify' : 'ticket';
  const existing   = guild.channels.cache.find(c =>
    c.name === `${namePrefix}-${user.username.toLowerCase()}`
  );
  if (existing) {
    return interaction.editReply({ ...err(`you already have an open ticket: ${existing}`), ephemeral: true });
  }

  let robloxUser = null;
  try {
    robloxUser = await getUserByUsername(robloxName);
  } catch {
    return interaction.editReply({ ...err('could not reach the Roblox API — try again in a moment'), ephemeral: true });
  }
  if (!robloxUser) {
    return interaction.editReply({ ...err(`no Roblox account found for **${robloxName}** — check the spelling`), ephemeral: true });
  }

  let parentId = cfg?.category_id || null;
  if (ticketType === 'tag'    && cfg?.tag_category_id)    parentId = cfg.tag_category_id;
  if (ticketType === 'verify' && cfg?.verify_category_id) parentId = cfg.verify_category_id;

  if (parentId && !guild.channels.cache.has(parentId)) parentId = null;

  const permOverwrites = [
    { id: guild.id, deny:  [PermissionFlagsBits.ViewChannel] },
    { id: user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ...(cfg?.staff_role ? [{ id: cfg.staff_role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
    ...(cfg?.vmr_role && ticketType === 'verify' ? [{ id: cfg.vmr_role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
  ];

  let channel;
  try {
    channel = await guild.channels.create({
      name:   `${namePrefix}-${user.username.toLowerCase()}`,
      type:   ChannelType.GuildText,
      parent: parentId,
      permissionOverwrites: permOverwrites,
    });
  } catch (e) {
    return interaction.editReply({ ...err(`failed to create ticket: ${e.message}`), ephemeral: true });
  }

  openTicket(guild.id, channel.id, user.id);
  await channel.setTopic(`roblox:${robloxUser.id}:${robloxUser.name}`).catch(() => {});

  const staffPing = cfg?.staff_role ? `<@&${cfg.staff_role}>` : null;
  const vmrPing   = cfg?.vmr_role && ticketType === 'verify' ? `<@&${cfg.vmr_role}>` : null;

  // ── TAG TICKET ─────────────────────────────────────────────────────────────
  if (ticketType === 'tag') {
    const headerCard = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        [`## tag ticket`, `**opener:** ${user}`, `**roblox:** \`${robloxUser.name}\``, '', `pick a tag from the dropdown below`].join('\n')
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Secondary),
    );

    if (staffPing) await channel.send({ content: staffPing });
    await channel.send({ flags: CV2, components: [headerCard, closeRow] });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_tag_select')
      .setPlaceholder('choose a tag...')
      .addOptions(TAG_CHOICES.map(t =>
        new StringSelectMenuOptionBuilder().setLabel(t.label).setValue(t.value)
      ));

    await channel.send({
      content: `${user}, pick the tag you want:`,
      components: [new ActionRowBuilder().addComponents(selectMenu)],
    });

    return interaction.editReply({ ...ok(`tag ticket opened: ${channel}`), ephemeral: true });
  }

  // ── VERIFY / SUPPORT TICKET ────────────────────────────────────────────────
  if (ticketType === 'verify') {
    await channel.send(`make sure you're in the group before your ticket is handled:\n${VERIFY_GROUP_LINK}`);
  }

  const headerCard = new ContainerBuilder()
    .setAccentColor(ACCENT)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      [`## ticket opened`, `**opener:** ${user}`, `**roblox:** \`${robloxUser.name}\``, '', `running group check — staff use buttons below`].join('\n')
    ))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_verify_${channel.id}`).setLabel('Verify').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ticket_accept_group`).setLabel('Accept into Group').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticket_kick_${channel.id}`).setLabel('Kick').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Secondary),
  );

  const pings = [staffPing, vmrPing].filter(Boolean);
  if (pings.length) await channel.send({ content: pings.join(' ') });
  await channel.send({ flags: CV2, components: [headerCard, row1] });

  try {
    const [groups, headshot] = await Promise.all([
      getUserGroups(robloxUser.id).catch(() => []),
      getHeadshot(robloxUser.id).catch(() => null),
    ]);

    ticketGroupsCache.set(channel.id, { robloxUser, groups, headshot });

    if (groups.length) {
      await channel.send(await buildTicketGcPage(robloxUser, groups, 0, headshot));
    } else {
      const empty = new ContainerBuilder().setAccentColor(ACCENT)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${robloxUser.name}'s groups\nno groups found`));
      await channel.send({ flags: CV2, components: [empty] });
    }

    const rankData = await getUserRankInGroup(robloxUser.id, VERIFY_GROUP_ID).catch(() => null);
    const inGroup  = !!rankData;

    if (ticketType === 'verify' && inGroup) {
      const verifyRoleId = getVerifyConfig(guild.id)?.verified_role;
      let autoVerified = false;
      try {
        const targetMember = await guild.members.fetch(user.id).catch(() => null);
        if (targetMember && verifyRoleId) { await targetMember.roles.add(verifyRoleId); autoVerified = true; }
      } catch {}

      const statusCard = new ContainerBuilder().setAccentColor(COLORS.green)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          [`## already in group`, `**${robloxUser.name}** is already in the group`, `**rank:** ${rankData.role?.name ?? 'Member'}`,
           autoVerified ? `\n${user} auto-verified and role given` : `\n${user} verified — check bot perms if role wasn't added`].join('\n')
        ))
        .addSeparatorComponents(S(false))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
      await channel.send({ flags: CV2, components: [statusCard] });
    } else {
      const statusCard = new ContainerBuilder().setAccentColor(inGroup ? COLORS.green : COLORS.red)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          inGroup
            ? [`## in group`, `**${robloxUser.name}** is in the group`, `**rank:** ${rankData.role?.name ?? 'Member'}`].join('\n')
            : [`## not in group`, `**${robloxUser.name}** is not in the group yet`, `they need to join first: ${VERIFY_GROUP_LINK}`].join('\n')
        ))
        .addSeparatorComponents(S(false))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
      await channel.send({ flags: CV2, components: [statusCard] });
    }
  } catch (e) {
    await channel.send({ ...err(`group check failed: ${e.message}`) }).catch(() => {});
  }

  await interaction.editReply({ ...ok(`ticket opened: ${channel}`), ephemeral: true });
}

async function handleGcNav(interaction, client) {
  const id        = interaction.customId;
  const channelId = interaction.channel.id;
  const cached    = ticketGroupsCache.get(channelId);
  if (!cached) return interaction.reply({ ...err('group data expired — close and re-open the ticket'), ephemeral: true });

  const { robloxUser, groups, headshot } = cached;
  const total = Math.ceil(groups.length / PAGE_SIZE) || 1;

  let page = parseInt(
    id.startsWith('ticket_gc_prev_') ? id.replace('ticket_gc_prev_', '') : id.replace('ticket_gc_next_', ''), 10
  );
  if (id.startsWith('ticket_gc_prev_')) page--;
  if (id.startsWith('ticket_gc_next_')) page++;
  page = Math.max(0, Math.min(page, total - 1));

  await interaction.update(await buildTicketGcPage(robloxUser, groups, page, headshot));
}

async function handleTagSelect(interaction, client) {
  const ticket = getTicket(interaction.channel.id);
  if (!ticket || ticket.user_id !== interaction.user.id)
    return interaction.reply({ ...err('only the ticket opener can select a tag'), ephemeral: true });

  const tagKey = interaction.values[0];
  const tagDef = TAG_MAP[tagKey];
  if (!tagDef) return interaction.reply({ ...err('unknown tag'), ephemeral: true });

  const displayLabel = TAG_CHOICES.find(t => t.value === tagKey)?.label ?? tagKey;

  await interaction.update({ content: `${interaction.user} requested the **${displayLabel}** tag`, components: [] });

  const c = new ContainerBuilder().setAccentColor(ACCENT)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      [`## tag request`, `**user:** ${interaction.user}`, `**tag:** ${displayLabel}`, '', `whitelisted staff must approve or deny`].join('\n')
    ))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tag_req_approve_${tagKey}`).setLabel('Approve').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tag_req_deny').setLabel('Deny').setStyle(ButtonStyle.Danger),
  );

  await interaction.channel.send({ flags: CV2, components: [c, row] });
}

async function handleStaffButton(interaction, client) {
  const id      = interaction.customId;
  const guildId = interaction.guild.id;
  const cfg     = getTicketConfig(guildId);

  if (!isVmrOrWhitelisted(interaction.member, guildId, cfg))
    return interaction.reply({ ...err('you need to be whitelisted or have the VMR role to use ticket controls'), ephemeral: true });

  // ── Tag approve ────────────────────────────────────────────────────────────
  if (id.startsWith('tag_req_approve_')) {
    const tagKey = id.replace('tag_req_approve_', '');
    const tagDef = TAG_MAP[tagKey];
    if (!tagDef) return interaction.reply({ ...err('unknown tag'), ephemeral: true });

    const topic      = interaction.channel.topic ?? '';
    const topicMatch = topic.match(/^roblox:(\d+):(.+)$/);
    if (!topicMatch) return interaction.reply({ ...err('could not find the Roblox user for this ticket'), ephemeral: true });

    const robloxId   = topicMatch[1];
    const robloxName = topicMatch[2];
    const verifyCfg  = getVerifyConfig(guildId);
    if (!verifyCfg?.cookie) return interaction.reply({ ...err('no Roblox cookie — use `.setcookie <cookie>` first'), ephemeral: true });

    await interaction.deferReply({ ephemeral: false });

    let groupRoles;
    try { groupRoles = await getGroupRoles(tagDef.groupId, verifyCfg.cookie); }
    catch (e) { return interaction.editReply(err(`failed to fetch roles: ${e.message}`)); }

    const groupRole = groupRoles.find(r => r.name.toLowerCase() === tagDef.roleName.toLowerCase());
    if (!groupRole) return interaction.editReply(err(`role **${tagDef.roleName}** not found in group \`${tagDef.groupId}\``));

    const memberCheck = await getUserRankInGroup(robloxId, tagDef.groupId).catch(() => null);
    if (!memberCheck) return interaction.editReply(err(`**${robloxName}** is not in group \`${tagDef.groupId}\` — they must join first`));

    try { await rankUser(tagDef.groupId, robloxId, groupRole.id, verifyCfg.cookie); }
    catch (e) { return interaction.editReply(err(`failed to apply tag: ${e.message}`)); }

    const displayLabel = TAG_CHOICES.find(t => t.value === tagKey)?.label ?? tagKey;
    const c = new ContainerBuilder().setAccentColor(COLORS.green)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## tag approved\n**${robloxName}** (\`${robloxId}\`) — **${displayLabel}** tag applied by ${interaction.user}`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    return interaction.editReply({ flags: CV2, components: [c] });
  }

  // ── Tag deny ───────────────────────────────────────────────────────────────
  if (id === 'tag_req_deny') {
    const ticket       = getTicket(interaction.channel.id);
    const targetMember = ticket ? await interaction.guild.members.fetch(ticket.user_id).catch(() => null) : null;
    const c = new ContainerBuilder().setAccentColor(COLORS.red)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## tag denied\n${targetMember ? `${targetMember}'s` : 'the'} tag request was denied by ${interaction.user}`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    return interaction.reply({ flags: CV2, components: [c] });
  }

  // ── Verify (Discord role) ─────────────────────────────────────────────────
  if (id.startsWith('ticket_verify_')) {
    const ticket = getTicket(interaction.channel.id);
    if (!ticket) return interaction.reply({ ...err('ticket data not found'), ephemeral: true });

    const targetMember = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
    if (!targetMember) return interaction.reply({ ...err('could not find the ticket opener'), ephemeral: true });

    const verifyRoleId = getVerifyConfig(guildId)?.verified_role;
    if (!verifyRoleId) return interaction.reply({ ...err('no verified role configured — use `.verify setup @role` first'), ephemeral: true });

    try { await targetMember.roles.add(verifyRoleId); }
    catch (e) { return interaction.reply({ ...err(`failed to add role: ${e.message}`), ephemeral: true }); }

    const c = new ContainerBuilder().setAccentColor(COLORS.green)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${targetMember} verified by ${interaction.user} — <@&${verifyRoleId}> granted`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    return interaction.reply({ flags: CV2, components: [c] });
  }

  // ── Accept into Group (Roblox join request) ───────────────────────────────
  if (id === 'ticket_accept_group') {
    const topic      = interaction.channel.topic ?? '';
    const topicMatch = topic.match(/^roblox:(\d+):(.+)$/);
    if (!topicMatch) return interaction.reply({ ...err('could not find the Roblox user for this ticket'), ephemeral: true });

    const robloxId   = topicMatch[1];
    const robloxName = topicMatch[2];
    const verifyCfg  = getVerifyConfig(guildId);
    if (!verifyCfg?.cookie) return interaction.reply({ ...err('no Roblox cookie — use `.setcookie <cookie>` first'), ephemeral: true });

    await interaction.deferReply({ ephemeral: false });

    try { await acceptJoinRequest(VERIFY_GROUP_ID, robloxId, verifyCfg.cookie); }
    catch (e) { return interaction.editReply(err(`failed to accept join request: ${e.message}`)); }

    const c = new ContainerBuilder().setAccentColor(COLORS.green)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## accepted into group\n**${robloxName}** (\`${robloxId}\`) accepted into the group by ${interaction.user}`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    return interaction.editReply({ flags: CV2, components: [c] });
  }

  // ── Kick ──────────────────────────────────────────────────────────────────
  if (id.startsWith('ticket_kick_')) {
    const ticket = getTicket(interaction.channel.id);
    if (!ticket) return interaction.reply({ ...err('ticket data not found'), ephemeral: true });

    const targetMember = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
    if (!targetMember) return interaction.reply({ ...err('could not find the ticket opener — they may have left'), ephemeral: true });

    try { await targetMember.kick(`kicked via ticket by ${interaction.user.tag}`); }
    catch (e) { return interaction.reply({ ...err(`failed to kick: ${e.message}`), ephemeral: true }); }

    const c = new ContainerBuilder().setAccentColor(COLORS.red)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${targetMember.user.username} was kicked by ${interaction.user}`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    return interaction.reply({ flags: CV2, components: [c] });
  }

  // ── Close Ticket ──────────────────────────────────────────────────────────
  if (id === 'ticket_close') {
    const ticket = getTicket(interaction.channel.id);
    if (!ticket) return interaction.reply({ ...err('this is not an open ticket'), ephemeral: true });

    closeTicket(interaction.channel.id);
    ticketGroupsCache.delete(interaction.channel.id);

    const c = new ContainerBuilder().setAccentColor(COLORS.red)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `ticket closed by ${interaction.user} — deleting in 5s`
      ))
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# /fazee`));
    await interaction.reply({ flags: CV2, components: [c] });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
}

module.exports = { showTicketModal, handleModalSubmit, handleStaffButton, handleTagSelect, handleGcNav };
