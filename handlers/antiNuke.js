'use strict';

const { getGuild, recordAntiNukeAction }    = require('../utils/database');
const { CV2, COLORS }                        = require('../utils/components');
const {
  AuditLogEvent,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

// ── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_MODULES = {
  ban:            true,
  kick:           true,
  channel_delete: true,
  channel_create: true,
  role_delete:    true,
  webhook_create: true,
  emoji_delete:   false,
  perm_grant:     true,
  vanity:         false,
  bot_add:        false,
};

const DEFAULT_THRESHOLDS = {
  ban:            3,
  kick:           3,
  channel_delete: 3,
  channel_create: 5,
  role_delete:    3,
  webhook_create: 5,
  emoji_delete:   5,
  perm_grant:     2,
};

const DANGEROUS_PERMS = [
  'Administrator', 'BanMembers', 'KickMembers', 'ManageChannels',
  'ManageGuild', 'ManageRoles', 'ManageWebhooks', 'MentionEveryone',
  'ManageMessages', 'DeafenMembers', 'MuteMembers',
];

// ── In-memory tracker ────────────────────────────────────────────────────────

const tracker = new Map();

function track(guildId, userId, action, windowMs) {
  const key  = `${guildId}:${userId}:${action}`;
  const now  = Date.now();
  const times = (tracker.get(key) || []).filter(t => now - t < windowMs);
  times.push(now);
  tracker.set(key, times);
  return times.length;
}

setInterval(() => {
  const cutoff = Date.now() - 600_000;
  for (const [k, times] of tracker) {
    if (times.every(t => t < cutoff)) tracker.delete(k);
  }
}, 300_000);

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJson(str, fallback) {
  try { return JSON.parse(str || JSON.stringify(fallback)); } catch { return fallback; }
}

function getConfig(guildId) {
  const g = getGuild(guildId);
  return {
    enabled:     !!g.antinuke_enabled,
    punish:      g.antinuke_punish || 'ban',
    window:      (g.antinuke_window || 10) * 1000,
    logChannel:  g.antinuke_log_channel,
    whitelist:   parseJson(g.antinuke_whitelist, []),
    superAdmins: parseJson(g.antinuke_super_admins, []),
    wlBots:      parseJson(g.antinuke_whitelisted_bots, []),
    modules:     { ...DEFAULT_MODULES, ...parseJson(g.antinuke_modules, {}) },
    thresholds:  { ...DEFAULT_THRESHOLDS, ...parseJson(g.antinuke_thresholds, {}) },
  };
}

function isBypassed(cfg, userId) {
  return cfg.superAdmins.includes(userId) || cfg.whitelist.includes(userId);
}

async function fetchExecutor(guild, auditEvent, delay = 800) {
  await new Promise(r => setTimeout(r, delay));
  try {
    const logs = await guild.fetchAuditLogs({ limit: 3, type: auditEvent });
    return logs.entries.first()?.executor ?? null;
  } catch { return null; }
}

// ── Punishment ────────────────────────────────────────────────────────────────

async function punish(guild, userId, reason, punishType) {
  if (userId === guild.ownerId) return;

  let member = null;
  try { member = await guild.members.fetch(userId); } catch {}

  if (member) {
    try {
      const bot      = guild.members.me;
      const toRemove = member.roles.cache
        .filter(r => r.id !== guild.id && r.position < bot.roles.highest.position)
        .map(r => r.id);
      if (toRemove.length) await member.roles.remove(toRemove, '[AntiNuke] Stripping roles').catch(() => {});
    } catch {}
  }

  if (punishType === 'ban') {
    await guild.bans.create(userId, { reason: `[AntiNuke] ${reason}`, deleteMessageSeconds: 86400 }).catch(() => {});
  } else if (punishType === 'kick' && member) {
    await member.kick(`[AntiNuke] ${reason}`).catch(() => {});
  }
}

// ── Log ───────────────────────────────────────────────────────────────────────

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

async function log(guild, cfg, { module: mod, executor, count, threshold, extra = '' }) {
  if (!cfg.logChannel) return;
  const ch = guild.channels.cache.get(cfg.logChannel);
  if (!ch) return;

  const c = new ContainerBuilder()
    .setAccentColor(COLORS.red)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## AntiNuke Triggered — ${mod}`))
    .addSeparatorComponents(S())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `**Executor** ${executor ? `<@${executor.id}> \`${executor.id}\`` : 'Unknown'}`,
      `**Action** ${count}/${threshold} within the configured window`,
      `**Punishment** ${cfg.punish}`,
      extra ? `**Detail** ${extra}` : null,
    ].filter(Boolean).join('\n')))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:T>`));

  ch.send({ flags: CV2, components: [c] }).catch(() => {});
}

// ── Core check ────────────────────────────────────────────────────────────────

async function check(guild, executor, action, extra = '') {
  if (!executor || executor.bot) return;

  const cfg       = getConfig(guild.id);
  if (!cfg.enabled)             return;
  if (!cfg.modules[action])     return;
  if (isBypassed(cfg, executor.id)) return;
  if (executor.id === guild.ownerId) return;

  const threshold = cfg.thresholds[action] ?? DEFAULT_THRESHOLDS[action] ?? 3;
  const count     = track(guild.id, executor.id, action, cfg.window);

  try { recordAntiNukeAction(guild.id, executor.id, action); } catch {}

  if (count >= threshold) {
    await punish(guild, executor.id, `${action} threshold exceeded (${count}/${threshold})`, cfg.punish);
    await log(guild, cfg, { module: action, executor, count, threshold, extra });
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────────

function setupAntiNukeListeners(client) {

  client.on('guildBanAdd', async (ban) => {
    const exec = await fetchExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
    if (exec) await check(ban.guild, exec, 'ban', `Banned: ${ban.user.tag}`);
  });

  client.on('guildMemberRemove', async (member) => {
    const exec = await fetchExecutor(member.guild, AuditLogEvent.MemberKick);
    if (exec && exec.id !== member.id)
      await check(member.guild, exec, 'kick', `Kicked: ${member.user.tag}`);
  });

  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    const exec = await fetchExecutor(channel.guild, AuditLogEvent.ChannelDelete);
    if (exec) await check(channel.guild, exec, 'channel_delete', `#${channel.name}`);
  });

  client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    const exec = await fetchExecutor(channel.guild, AuditLogEvent.ChannelCreate);
    if (exec) await check(channel.guild, exec, 'channel_create', `#${channel.name}`);
  });

  client.on('roleDelete', async (role) => {
    const exec = await fetchExecutor(role.guild, AuditLogEvent.RoleDelete);
    if (exec) await check(role.guild, exec, 'role_delete', `@${role.name}`);
  });

  client.on('webhookUpdate', async (channel) => {
    if (!channel.guild) return;
    const exec = await fetchExecutor(channel.guild, AuditLogEvent.WebhookCreate);
    if (exec) await check(channel.guild, exec, 'webhook_create', `#${channel.name}`);
  });

  client.on('emojiDelete', async (emoji) => {
    const exec = await fetchExecutor(emoji.guild, AuditLogEvent.EmojiDelete);
    if (exec) await check(emoji.guild, exec, 'emoji_delete', emoji.name);
  });

  client.on('roleUpdate', async (oldRole, newRole) => {
    const cfg = getConfig(newRole.guild.id);
    if (!cfg.enabled || !cfg.modules.perm_grant) return;
    const gained = DANGEROUS_PERMS.filter(p => {
      try { return !oldRole.permissions.has(p) && newRole.permissions.has(p); } catch { return false; }
    });
    if (!gained.length) return;
    const exec = await fetchExecutor(newRole.guild, AuditLogEvent.RoleUpdate);
    if (exec) await check(newRole.guild, exec, 'perm_grant', `@${newRole.name} gained: ${gained.join(', ')}`);
  });

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const cfg = getConfig(newMember.guild.id);
    if (!cfg.enabled || !cfg.modules.perm_grant) return;
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    if (!addedRoles.size) return;
    const dangerous = addedRoles.some(r =>
      DANGEROUS_PERMS.some(p => { try { return r.permissions.has(p); } catch { return false; } })
    );
    if (!dangerous) return;
    const exec = await fetchExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate);
    if (exec && exec.id !== newMember.id)
      await check(newMember.guild, exec, 'perm_grant', `Gave dangerous role to ${newMember.user.tag}`);
  });

  client.on('guildUpdate', async (oldGuild, newGuild) => {
    const cfg = getConfig(newGuild.id);
    if (!cfg.enabled || !cfg.modules.vanity) return;
    if (oldGuild.vanityURLCode === newGuild.vanityURLCode) return;
    const exec = await fetchExecutor(newGuild, AuditLogEvent.GuildUpdate);
    if (!exec || isBypassed(cfg, exec.id) || exec.id === newGuild.ownerId) return;
    if (oldGuild.vanityURLCode) {
      newGuild.setVanityCode(oldGuild.vanityURLCode, '[AntiNuke] Restoring vanity URL').catch(() => {});
    }
    await punish(newGuild, exec.id, 'Vanity URL tampered', cfg.punish);
    await log(newGuild, cfg, {
      module: 'vanity', executor: exec, count: 1, threshold: 1,
      extra: `Changed from \`${oldGuild.vanityURLCode}\` → \`${newGuild.vanityURLCode}\``,
    });
  });

  client.on('guildMemberAdd', async (member) => {
    if (!member.user.bot) return;
    const cfg = getConfig(member.guild.id);
    if (!cfg.enabled || !cfg.modules.bot_add) return;
    if (cfg.wlBots.includes(member.id)) return;
    const exec   = await fetchExecutor(member.guild, AuditLogEvent.BotAdd);
    const reason = `[AntiNuke] Unauthorized bot added: ${member.user.tag}`;
    await member.kick(reason).catch(() => {});
    if (exec && exec.id !== member.guild.ownerId && !isBypassed(cfg, exec.id)) {
      await punish(member.guild, exec.id, `Added unauthorized bot ${member.user.tag}`, cfg.punish);
      await log(member.guild, cfg, {
        module: 'bot_add', executor: exec, count: 1, threshold: 1,
        extra: `Bot: ${member.user.tag} (${member.id})`,
      });
    }
  });
}

module.exports = { setupAntiNukeListeners, DEFAULT_MODULES, DEFAULT_THRESHOLDS };
