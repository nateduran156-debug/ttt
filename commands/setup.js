'use strict';

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  SlashCommandBuilder, PermissionFlagsBits, ChannelType,
} = require('discord.js');
const {
  getGuild, getPrefix, getAutomodConfig, getTicketConfig,
  getVerifyConfig, getConfig, updateGuild, setPrefix,
  setAutomodConfig, setVerifyConfig, setConfig,
} = require('../utils/database');

const prefixName = 'setup';
const aliases    = ['quicksetup', 'serversetup'];
const category   = 'misc';

// ─── Cache: messageId → { authorId, channelId } ─────────────────────────────
const setupCache = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function icon(val) { return val ? '✅' : '❌'; }

function buildPanel(guild, prefix) {
  const g  = getGuild(guild.id);
  const am = getAutomodConfig(guild.id) || {};
  const tc = getTicketConfig(guild.id)  || {};
  const vc = getVerifyConfig(guild.id)  || {};
  const cookie      = getConfig(guild.id, 'cookie');
  const robloxGroup = getConfig(guild.id, 'roblox_group_id');

  const systems = [
    { label: 'Prefix',       ok: true,              detail: `Currently \`${prefix}\`` },
    { label: 'Mod Logs',     ok: !!g.mod_log_channel,       detail: g.mod_log_channel       ? `<#${g.mod_log_channel}>`       : 'Not set' },
    { label: 'Join Logs',    ok: !!g.join_log_channel,      detail: g.join_log_channel      ? `<#${g.join_log_channel}>`      : 'Not set' },
    { label: 'Leave Logs',   ok: !!g.leave_log_channel,     detail: g.leave_log_channel     ? `<#${g.leave_log_channel}>`     : 'Not set' },
    { label: 'Message Logs', ok: !!g.message_log_channel,   detail: g.message_log_channel   ? `<#${g.message_log_channel}>`   : 'Not set' },
    { label: 'Voice Logs',   ok: !!g.voice_log_channel,     detail: g.voice_log_channel     ? `<#${g.voice_log_channel}>`     : 'Not set' },
    { label: 'Welcome',      ok: !!(g.welcome_channel && g.welcome_enabled), detail: g.welcome_channel ? `<#${g.welcome_channel}> • ${g.welcome_enabled ? 'Enabled' : 'Disabled'}` : 'Not set' },
    { label: 'Anti-Nuke',    ok: !!g.antinuke_enabled,      detail: g.antinuke_enabled      ? `Enabled • Punish: ${g.antinuke_punish}` : 'Disabled' },
    { label: 'Auto-Mod',     ok: !!am.enabled,              detail: am.enabled              ? `Enabled • Spam ≥${am.spam_threshold} msg/5s` : 'Disabled' },
    { label: 'Roblox Group', ok: !!robloxGroup,             detail: robloxGroup             ? `Group \`${robloxGroup}\`` : 'Not linked' },
    { label: 'Cookie',       ok: !!cookie,                  detail: cookie                  ? 'Cookie stored' : 'Not set (needed for rank/tag/shout)' },
    { label: 'Tickets',      ok: !!(tc.staff_role),         detail: tc.staff_role           ? `Staff: <@&${tc.staff_role}>` : 'Not configured' },
    { label: 'Verified Role',ok: !!(vc.verified_role),      detail: vc.verified_role        ? `<@&${vc.verified_role}>` : 'Not set' },
  ];

  const doneCount = systems.filter(s => s.ok).length;

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle('⚙️  Server Setup')
    .setDescription(
      `**${doneCount}/${systems.length}** systems configured.\n` +
      `Click a button below — the bot will **automatically create channels** and configure everything for you.`
    )
    .addFields(systems.map(s => ({
      name: `${icon(s.ok)} ${s.label}`,
      value: s.detail,
      inline: true,
    })))
    .setFooter({ text: `${guild.name}  •  prefix: ${prefix}` });

  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup_logs').setLabel('📋 Log Channels').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup_antinuke').setLabel('🛡️ Anti-Nuke').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup_automod').setLabel('🤖 Auto-Mod').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup_welcome').setLabel('👋 Welcome').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup_tickets').setLabel('🎫 Tickets').setStyle(ButtonStyle.Primary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup_prefix').setLabel('🔧 Prefix').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_roblox').setLabel('🎮 Roblox Group').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_cookie').setLabel('🍪 Cookie').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_verifiedrole').setLabel('✔️ Verified Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_close').setLabel('✕  Close').setStyle(ButtonStyle.Danger),
    ),
  ];

  return { embeds: [embed], components: rows };
}

// ─── Find-or-create a channel ─────────────────────────────────────────────────

async function findOrCreate(guild, name, options = {}) {
  const existing = guild.channels.cache.find(
    c => c.name === name && (!options.parent || c.parentId === options.parent)
  );
  if (existing) return existing;
  return guild.channels.create({ name, ...options });
}

// ─── Auto-setup routines ─────────────────────────────────────────────────────

async function doSetupLogs(guild) {
  const logCategory = await findOrCreate(guild, '📋-logs', {
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
    ],
  });

  const defs = [
    { name: 'mod-logs',     field: 'mod_log_channel' },
    { name: 'join-logs',    field: 'join_log_channel' },
    { name: 'leave-logs',   field: 'leave_log_channel' },
    { name: 'message-logs', field: 'message_log_channel' },
    { name: 'voice-logs',   field: 'voice_log_channel' },
  ];

  const fields = {};
  for (const def of defs) {
    const ch = await findOrCreate(guild, def.name, {
      type: ChannelType.GuildText,
      parent: logCategory.id,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
      ],
    });
    fields[def.field] = ch.id;
  }

  updateGuild(guild.id, fields);
  return logCategory;
}

async function doSetupAntiNuke(guild) {
  const g = getGuild(guild.id);
  let logCh = g.antinuke_log_channel
    ? guild.channels.cache.get(g.antinuke_log_channel)
    : null;

  if (!logCh) {
    logCh = await findOrCreate(guild, 'antinuke-logs', {
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
  }

  updateGuild(guild.id, {
    antinuke_enabled:     1,
    antinuke_punish:      'ban',
    antinuke_window:      10,
    antinuke_log_channel: logCh.id,
  });
}

async function doSetupAutoMod(guild) {
  const am = getAutomodConfig(guild.id) || {};
  let logCh = am.log_channel
    ? guild.channels.cache.get(am.log_channel)
    : null;

  if (!logCh) {
    logCh = await findOrCreate(guild, 'automod-logs', {
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
  }

  setAutomodConfig(guild.id, {
    enabled:         1,
    log_channel:     logCh.id,
    spam_threshold:  5,
    spam_window:     5000,
    caps_threshold:  70,
    link_mode:       'off',
    mention_limit:   5,
  });
}

async function doSetupWelcome(guild) {
  const welcomeCh = await findOrCreate(guild, 'welcome', {
    type: ChannelType.GuildText,
    topic: 'Welcome new members!',
  });

  updateGuild(guild.id, {
    welcome_channel: welcomeCh.id,
    welcome_message: 'Welcome {user} to **{server}**! 🎉 Make sure to read the rules.',
    welcome_enabled: 1,
  });

  return welcomeCh;
}

async function doSetupTickets(guild) {
  const cat = await findOrCreate(guild, '🎫-tickets', {
    type: ChannelType.GuildCategory,
  });

  const logCh = await findOrCreate(guild, 'ticket-logs', {
    type: ChannelType.GuildText,
    parent: cat.id,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ],
  });

  const { setTicketConfig } = require('../utils/database');
  setTicketConfig(guild.id, {
    category_id: cat.id,
    log_channel:  logCh.id,
  });
}

// ─── Modal builders ───────────────────────────────────────────────────────────

function modalPrefix(msgId, chanId) {
  return new ModalBuilder()
    .setCustomId(`setup_modal_prefix:${msgId}:${chanId}`)
    .setTitle('Change Prefix')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('prefix')
        .setLabel('New prefix (max 5 characters)')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(5)
        .setRequired(true)
    ));
}

function modalCookie(msgId, chanId) {
  return new ModalBuilder()
    .setCustomId(`setup_modal_cookie:${msgId}:${chanId}`)
    .setTitle('Set Roblox Cookie')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('cookie')
        .setLabel('.ROBLOSECURITY cookie value')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    ));
}

function modalRoblox(msgId, chanId) {
  return new ModalBuilder()
    .setCustomId(`setup_modal_roblox:${msgId}:${chanId}`)
    .setTitle('Link Roblox Group')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('group_id')
        .setLabel('Roblox Group ID')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ));
}

function modalVerifiedRole(msgId, chanId) {
  return new ModalBuilder()
    .setCustomId(`setup_modal_verifiedrole:${msgId}:${chanId}`)
    .setTitle('Set Verified Role')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel('Role ID (paste the role ID here)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ));
}

// ─── Prefix command ───────────────────────────────────────────────────────────

async function prefixExecute(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply({ content: '❌ You need **Manage Server** to use setup.' });

  const prefix = getPrefix(message.guild.id);
  const msg = await message.reply({ ...buildPanel(message.guild, prefix), fetchReply: true });
  setupCache.set(msg.id, { authorId: message.author.id, channelId: message.channel.id });
  setTimeout(() => setupCache.delete(msg.id), 10 * 60 * 1000);
}

// ─── Slash command ────────────────────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Opens the interactive server setup panel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const prefix = getPrefix(interaction.guild.id);
  await interaction.reply({ ...buildPanel(interaction.guild, prefix), fetchReply: true })
    .then(msg => {
      setupCache.set(msg.id, { authorId: interaction.user.id, channelId: interaction.channelId });
      setTimeout(() => setupCache.delete(msg.id), 10 * 60 * 1000);
    });
}

module.exports = {
  data, execute, prefixName, aliases, category, prefixExecute,
  buildPanel, setupCache,
  doSetupLogs, doSetupAntiNuke, doSetupAutoMod, doSetupWelcome, doSetupTickets,
  modalPrefix, modalCookie, modalRoblox, modalVerifiedRole,
};
