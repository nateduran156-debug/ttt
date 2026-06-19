'use strict';

// Pure in-memory store — no sql.js, no better-sqlite3, no file I/O.
// All exported functions match the original interface exactly.

const store = {
  guild_config: new Map(), guilds: new Map(), whitelist_users: new Map(),
  whitelist_roles: new Map(), sniper_targets: new Map(), tags: new Map(),
  warnings: [], giveaways: new Map(), reminders: [], raid_points: new Map(),
  rank_points: new Map(), rank_roles: new Map(), raid_rank_roles: new Map(),
  custom_aliases: new Map(), autoresponders: new Map(), antinuke_actions: [],
  verify_config: new Map(), verified_users: new Map(), automod_config: new Map(),
  ticket_config: new Map(), tickets: new Map(),
};
let _id = 1;
const nextId = () => _id++;
const now = () => Math.floor(Date.now() / 1000);

function getConfig(g, k) { return store.guild_config.get(`${g}:${k}`) ?? null; }
function setConfig(g, k, v) { store.guild_config.set(`${g}:${k}`, v); }
function getPrefix(g) { return getConfig(g, 'prefix') || '!'; }
function setPrefix(g, p) { setConfig(g, 'prefix', p); }
function ensureGuild(g) {
  if (!store.guilds.has(g)) store.guilds.set(g, { guild_id: g, prefix: '!', log_channel: null, mod_log_channel: null, message_log_channel: null, join_log_channel: null, leave_log_channel: null, voice_log_channel: null, welcome_channel: null, welcome_enabled: 0, welcome_message: null, welcome_dm: 0, welcome_dm_message: null, welcome_roles: '[]', antinuke_enabled: 0, antinuke_punish: 'ban', antinuke_window: 10, antinuke_log_channel: null, antinuke_whitelist: '[]', antinuke_super_admins: '[]', antinuke_whitelisted_bots: '[]', antinuke_modules: '{}', antinuke_thresholds: '{}' });
}
function getGuild(g) { ensureGuild(g); return { ...store.guilds.get(g) }; }
function updateGuildField(g, field, v) { ensureGuild(g); store.guilds.get(g)[field] = v; }

function isUserWhitelisted(g, u, cat) { return store.whitelist_users.has(`${g}:${u}:${cat}`) || store.whitelist_users.has(`${g}:${u}:all`); }
function isRoleWhitelisted(g, r, cat) { return store.whitelist_roles.has(`${g}:${r}:${cat}`) || store.whitelist_roles.has(`${g}:${r}:all`); }
function hasAnyUserWhitelist(g, u) { for (const k of store.whitelist_users.keys()) { if (k.startsWith(`${g}:${u}:`)) return true; } return false; }
function hasAnyRoleWhitelist(g, r) { for (const k of store.whitelist_roles.keys()) { if (k.startsWith(`${g}:${r}:`)) return true; } return false; }
function addWhitelistUser(g, u, cat) { store.whitelist_users.set(`${g}:${u}:${cat}`, { guild_id: g, user_id: u, category: cat }); }
function removeWhitelistUser(g, u, cat) { if (cat === 'all') { for (const k of store.whitelist_users.keys()) { if (k.startsWith(`${g}:${u}:`)) store.whitelist_users.delete(k); } } else store.whitelist_users.delete(`${g}:${u}:${cat}`); return { changes: 1 }; }
function addWhitelistRole(g, r, cat) { store.whitelist_roles.set(`${g}:${r}:${cat}`, { guild_id: g, role_id: r, category: cat }); }
function removeWhitelistRole(g, r, cat) { if (cat === 'all') { for (const k of store.whitelist_roles.keys()) { if (k.startsWith(`${g}:${r}:`)) store.whitelist_roles.delete(k); } } else store.whitelist_roles.delete(`${g}:${r}:${cat}`); return { changes: 1 }; }
function getWhitelistUsers(g) { return [...store.whitelist_users.values()].filter(r => r.guild_id === g); }
function getWhitelistRoles(g) { return [...store.whitelist_roles.values()].filter(r => r.guild_id === g); }

function getSniperTarget(g, rid) { return store.sniper_targets.get(`${g}:${rid}`); }
function getAllSniperTargets() { return [...store.sniper_targets.values()]; }
function getSniperTargetsByGuild(g) { return [...store.sniper_targets.values()].filter(r => r.guild_id === g); }
function addSniperTarget({ guildId, channelId, robloxId, robloxUsername, serverLink, notifyRole, addedBy }) { store.sniper_targets.set(`${guildId}:${robloxId}`, { guild_id: guildId, channel_id: channelId, roblox_id: robloxId, roblox_username: robloxUsername, server_link: serverLink||null, notify_role: notifyRole||null, added_by: addedBy||null }); }
function removeSniperTarget(g, rid) { store.sniper_targets.delete(`${g}:${rid}`); return { changes: 1 }; }
function updateSniperTargetChannel(g, rid, ch) { const t = store.sniper_targets.get(`${g}:${rid}`); if (t) t.channel_id = ch; }

function getTag(g, n) { return store.tags.get(`${g}:${n}`); }
function getAllTags(g) { return [...store.tags.values()].filter(r => r.guild_id === g).sort((a,b) => a.name.localeCompare(b.name)); }
function setTag(g, n, content, ownerId) { store.tags.set(`${g}:${n}`, { guild_id: g, name: n, content, owner_id: ownerId }); }
function deleteTag(g, n) { store.tags.delete(`${g}:${n}`); return { changes: 1 }; }

function addWarning(g, u, m, reason) { store.warnings.push({ id: nextId(), guild_id: g, user_id: u, mod_id: m, reason, created_at: now() }); }
function getWarnings(g, u) { return store.warnings.filter(r => r.guild_id === g && r.user_id === u).sort((a,b) => b.created_at - a.created_at); }
function clearWarnings(g, u) { const b = store.warnings.length; store.warnings = store.warnings.filter(r => !(r.guild_id === g && r.user_id === u)); return { changes: b - store.warnings.length }; }

function getGiveaway(id) { return store.giveaways.get(id); }
function createGiveaway(d) { store.giveaways.set(d.id, { id: d.id, guild_id: d.guildId, channel_id: d.channelId, message_id: null, prize: d.prize, winners: d.winners, entries: '[]', winner_ids: '[]', host_id: d.hostId, status: 'active', ends_at: d.endsAt, ended_at: null }); }
function updateGiveaway(id, fields) { const g = store.giveaways.get(id); if (g) Object.assign(g, fields); }
function getActiveGiveaways() { return [...store.giveaways.values()].filter(r => r.status === 'active'); }

function addReminder(u, ch, msg, firesAt) { store.reminders.push({ id: nextId(), user_id: u, channel_id: ch, message: msg, fires_at: firesAt, created_at: now(), fired: 0 }); }
function getPendingReminders() { const n = now(); return store.reminders.filter(r => r.fired === 0 && r.fires_at <= n); }
function markReminderFired(id) { const r = store.reminders.find(r => r.id === id); if (r) r.fired = 1; }

function getRaidSeason(g) { return getConfig(g, 'raid_season') || 'Season 1'; }
function updateRaidSeason(g, n) { setConfig(g, 'raid_season', `Season ${n}`); }
function getRaidPoints(u, g, s) { return store.raid_points.get(`${u}:${g}:${s}`); }
function modifyRaidPoints(u, g, s, delta) { const k = `${u}:${g}:${s}`; if (!store.raid_points.has(k)) store.raid_points.set(k, { user_id: u, guild_id: g, season: s, points: 0 }); const r = store.raid_points.get(k); r.points = Math.max(0, r.points + delta); return { ...r }; }
function setRaidPoints(u, g, s, points) { store.raid_points.set(`${u}:${g}:${s}`, { user_id: u, guild_id: g, season: s, points }); }
function getRaidLeaderboard(g, s) { return [...store.raid_points.values()].filter(r => r.guild_id === g && r.season === s).sort((a,b) => b.points - a.points).slice(0,10); }

function getRankPoints(u, g) { return store.rank_points.get(`${u}:${g}`); }
function modifyRankPoints(u, g, delta) { const k = `${u}:${g}`; if (!store.rank_points.has(k)) store.rank_points.set(k, { user_id: u, guild_id: g, points: 0 }); const r = store.rank_points.get(k); r.points = Math.max(0, r.points + delta); return { ...r }; }
function getRankLeaderboard(g) { return [...store.rank_points.values()].filter(r => r.guild_id === g).sort((a,b) => b.points - a.points).slice(0,10); }

function getRankRolesFromDB(g) { return [...store.rank_roles.values()].filter(r => r.guild_id === g).sort((a,b) => a.threshold - b.threshold); }
function addRankRoleToDB(g, r, t) { store.rank_roles.set(`${g}:${r}`, { guild_id: g, role_id: r, threshold: t }); }
function removeRankRoleFromDB(g, r) { store.rank_roles.delete(`${g}:${r}`); return { changes: 1 }; }

function getRaidRankRoles(g) { return [...store.raid_rank_roles.values()].filter(r => r.guild_id === g).sort((a,b) => a.threshold - b.threshold); }
function addRaidRankRole(g, r, t) { store.raid_rank_roles.set(`${g}:${r}`, { guild_id: g, role_id: r, threshold: t }); }
function removeRaidRankRole(g, r) { const deleted = store.raid_rank_roles.delete(`${g}:${r}`); return { changes: deleted ? 1 : 0 }; }

function getCustomAliases(g) { return [...store.custom_aliases.values()].filter(r => r.guild_id === g).sort((a,b) => a.shortcut.localeCompare(b.shortcut)); }
function addCustomAlias(g, shortcut, target, createdBy) { store.custom_aliases.set(`${g}:${shortcut}`, { id: nextId(), guild_id: g, shortcut, target, created_by: createdBy }); }
function removeCustomAlias(g, shortcut) { store.custom_aliases.delete(`${g}:${shortcut}`); return { changes: 1 }; }
function resolveAlias(g, shortcut) { const r = store.custom_aliases.get(`${g}:${shortcut}`); return r ? r.target : null; }

function getAutoResponders(g) { return [...store.autoresponders.values()].filter(r => r.guild_id === g); }
function addAutoResponder(g, trigger, response, matchType, createdBy) { store.autoresponders.set(`${g}:${trigger.toLowerCase()}`, { id: nextId(), guild_id: g, trigger: trigger.toLowerCase(), response, match_type: matchType, created_by: createdBy }); }
function removeAutoResponder(g, id) { for (const [k,v] of store.autoresponders.entries()) { if (v.guild_id === g && v.id === id) { store.autoresponders.delete(k); break; } } return { changes: 1 }; }

function recordAntiNukeAction(g, u, action) { store.antinuke_actions.push({ id: nextId(), guild_id: g, user_id: u, action, created_at: now() }); }
function getAntiNukeActions(g, u, action, since) { return store.antinuke_actions.filter(r => r.guild_id === g && r.user_id === u && r.action === action && r.created_at >= since); }

function getVerifyConfig(g) { return store.verify_config.get(g); }
function setVerifyConfig(g, fields) { if (!store.verify_config.has(g)) store.verify_config.set(g, { guild_id: g, verified_role: null, log_channel: null, cookie: null }); Object.assign(store.verify_config.get(g), fields); }
function getVerifiedUser(g, u) { return store.verified_users.get(`${g}:${u}`); }
function setVerifiedUser(g, u, robloxId, robloxName) { store.verified_users.set(`${g}:${u}`, { guild_id: g, user_id: u, roblox_id: robloxId, roblox_name: robloxName, verified_at: now() }); }
function removeVerifiedUser(g, u) { store.verified_users.delete(`${g}:${u}`); return { changes: 1 }; }

function getAutomodConfig(g) { return store.automod_config.get(g); }
function setAutomodConfig(g, fields) { if (!store.automod_config.has(g)) store.automod_config.set(g, { guild_id: g, enabled: 0, log_channel: null, spam_threshold: 5, spam_window: 5000, caps_threshold: 70, link_mode: 'off', mention_limit: 5, bad_words: '[]', whitelist_roles: '[]', whitelist_channels: '[]' }); Object.assign(store.automod_config.get(g), fields); }

function getTicketConfig(g) { return store.ticket_config.get(g); }
function setTicketConfig(g, fields) { if (!store.ticket_config.has(g)) store.ticket_config.set(g, { guild_id: g, category_id: null, tag_category_id: null, verify_category_id: null, log_channel: null, support_role: null, staff_role: null, vmr_role: null, panel_channel: null, panel_message: null, open_message: 'Staff will be with you shortly.', max_tickets: 1 }); Object.assign(store.ticket_config.get(g), fields); }
function openTicket(g, ch, u) { store.tickets.set(ch, { id: nextId(), guild_id: g, channel_id: ch, user_id: u, status: 'open', created_at: now(), closed_at: null }); }
function closeTicket(ch) { const t = store.tickets.get(ch); if (t) { t.status = 'closed'; t.closed_at = now(); } }
function getOpenTicket(g, u) { return [...store.tickets.values()].find(r => r.guild_id === g && r.user_id === u && r.status === 'open'); }

const db = { prepare: () => ({ get: () => undefined, all: () => [], run: () => ({ changes: 0 }) }), exec: () => {}, pragma: () => {} };

module.exports = {
  db, getConfig, setConfig, getPrefix, setPrefix, getGuild, ensureGuild, updateGuildField,
  isUserWhitelisted, isRoleWhitelisted, hasAnyUserWhitelist, hasAnyRoleWhitelist, addWhitelistUser, removeWhitelistUser, addWhitelistRole, removeWhitelistRole, getWhitelistUsers, getWhitelistRoles,
  getSniperTarget, getAllSniperTargets, getSniperTargetsByGuild, addSniperTarget, removeSniperTarget, updateSniperTargetChannel,
  getTag, getAllTags, setTag, deleteTag, addWarning, getWarnings, clearWarnings,
  getGiveaway, createGiveaway, updateGiveaway, getActiveGiveaways, addReminder, getPendingReminders, markReminderFired,
  getRaidSeason, updateRaidSeason, getRaidPoints, modifyRaidPoints, setRaidPoints, getRaidLeaderboard,
  getRankPoints, modifyRankPoints, getRankLeaderboard, getRankRolesFromDB, addRankRoleToDB, removeRankRoleFromDB,
  getRaidRankRoles, addRaidRankRole, removeRaidRankRole,
  getCustomAliases, addCustomAlias, removeCustomAlias, resolveAlias, getAutoResponders, addAutoResponder, removeAutoResponder,
  recordAntiNukeAction, getAntiNukeActions, getVerifyConfig, setVerifyConfig, getVerifiedUser, setVerifiedUser, removeVerifiedUser,
  getAutomodConfig, setAutomodConfig, getTicketConfig, setTicketConfig, openTicket, closeTicket, getOpenTicket,
};

// ── Aliases and missing functions used by commands ──────────────────────────

// updateGuild: update multiple fields at once on a guild record
function updateGuild(guildId, fields) {
  ensureGuild(guildId);
  Object.assign(store.guilds.get(guildId), fields);
}

// setGuild: alias for ensureGuild (creates if missing, then updates fields)
function setGuild(guildId, fields) {
  ensureGuild(guildId);
  if (fields) Object.assign(store.guilds.get(guildId), fields);
}

// getGiveaways: get giveaways by guild and optional status
function getGiveaways(guildId, status) {
  return [...store.giveaways.values()].filter(r =>
    r.guild_id === guildId && (status ? r.status === status : true)
  );
}

// getSniperTargets: alias for getSniperTargetsByGuild
function getSniperTargets(guildId) { return getSniperTargetsByGuild(guildId); }

// getTicket: get a ticket by channel ID
function getTicket(channelId) { return store.tickets.get(channelId); }

// Rank points setter (set absolute value)
function setRankPoints(userId, guildId, points) {
  store.rank_points.set(`${userId}:${guildId}`, { user_id: userId, guild_id: guildId, points });
}

// clearWhitelistRoles: remove all role whitelist entries for a guild
function clearWhitelistRoles(guildId) {
  for (const k of store.whitelist_roles.keys()) {
    if (k.startsWith(`${guildId}:`)) store.whitelist_roles.delete(k);
  }
  return { changes: 1 };
}

// Vanity track store
const vanity_tracks = new Map();
const vanity_logs   = [];

function addVanityTrack(guildId, userId, tag, addedBy) {
  vanity_tracks.set(`${guildId}:${userId}`, { guild_id: guildId, user_id: userId, tag, added_by: addedBy, added_at: now() });
}
function getVanityTracks(guildId) {
  return [...vanity_tracks.values()].filter(r => r.guild_id === guildId);
}
function removeVanityTrack(guildId, userId) {
  vanity_tracks.delete(`${guildId}:${userId}`);
  return { changes: 1 };
}
function addVanityLog(guildId, userId, action) {
  vanity_logs.push({ guild_id: guildId, user_id: userId, action, created_at: now() });
}
function getVanityLogs(guildId, limit = 50) {
  return vanity_logs.filter(r => r.guild_id === guildId).slice(-limit).reverse();
}

// Opp vanity watch list (slugs per guild)
const opp_vanities_store  = new Map(); // key: guildId:vanity
const vanity_settings_map = new Map(); // key: guildId

function addOppVanity(guildId, vanity, addedBy) {
  const key = `${guildId}:${vanity}`;
  if (opp_vanities_store.has(key)) throw new Error('already exists');
  opp_vanities_store.set(key, { guild_id: guildId, vanity, added_by: addedBy, added_at: now() });
}
function removeOppVanity(guildId, vanity) {
  const deleted = opp_vanities_store.delete(`${guildId}:${vanity}`);
  return { changes: deleted ? 1 : 0 };
}
function getOppVanities(guildId) {
  return [...opp_vanities_store.values()].filter(r => r.guild_id === guildId);
}
function getVanitySettings(guildId) {
  return vanity_settings_map.get(guildId) ?? null;
}
function setVanitySettings(guildId, fields) {
  if (!vanity_settings_map.has(guildId))
    vanity_settings_map.set(guildId, { guild_id: guildId, channel_id: null, ping_enabled: 0, ping_role_id: null });
  Object.assign(vanity_settings_map.get(guildId), fields);
}

// Roblox link store (linkUser / unlinkUser / getUser)
const linked_users = new Map();

function linkUser(guildId, userId, robloxId, robloxName) {
  linked_users.set(`${guildId}:${userId}`, { guild_id: guildId, user_id: userId, roblox_id: robloxId, roblox_name: robloxName, linked_at: now() });
}
function unlinkUser(guildId, userId) {
  linked_users.delete(`${guildId}:${userId}`);
  return { changes: 1 };
}
function getUser(guildId, userId) {
  return linked_users.get(`${guildId}:${userId}`) || getVerifiedUser(guildId, userId) || null;
}

function getAllLinkedUsers(guildId) {
  const fromLinked   = [...linked_users.values()].filter(r => r.guild_id === guildId);
  const fromVerified = [...store.verified_users.values()].filter(r => r.guild_id === guildId);
  const seen = new Set();
  return [...fromLinked, ...fromVerified].filter(r => {
    if (seen.has(r.user_id)) return false;
    seen.add(r.user_id);
    return true;
  });
}

// ── Tag log channel ───────────────────────────────────────────────────────────
const tag_log_channels = new Map(); // guildId → channelId
function getTagLogChannel(guildId) { return tag_log_channels.get(guildId) ?? null; }
function setTagLogChannel(guildId, channelId) { tag_log_channels.set(guildId, channelId); }

// ── Tag manager whitelist ─────────────────────────────────────────────────────
const tag_managers = new Map(); // key: guildId → { users: [], roles: [] }

function getTagManagers(guildId) {
  if (!tag_managers.has(guildId)) tag_managers.set(guildId, { users: [], roles: [] });
  return tag_managers.get(guildId);
}

function addTagManager(guildId, type, id) {
  const wl = getTagManagers(guildId);
  if (type === 'user' && !wl.users.includes(id)) wl.users.push(id);
  if (type === 'role' && !wl.roles.includes(id)) wl.roles.push(id);
}

function removeTagManager(guildId, type, id) {
  const wl = getTagManagers(guildId);
  if (type === 'user') wl.users = wl.users.filter(u => u !== id);
  if (type === 'role') wl.roles = wl.roles.filter(r => r !== id);
}

// Extra exports — appended to the existing module.exports
Object.assign(module.exports, {
  updateGuild, setGuild, getGiveaways, getSniperTargets, getTicket,
  setRankPoints, clearWhitelistRoles,
  addVanityTrack, getVanityTracks, removeVanityTrack, addVanityLog, getVanityLogs,
  addOppVanity, removeOppVanity, getOppVanities, getVanitySettings, setVanitySettings,
  linkUser, unlinkUser, getUser, getAllLinkedUsers,
  getTagLogChannel, setTagLogChannel,
  getTagManagers, addTagManager, removeTagManager,
});
