'use strict';

const { db, getGuild } = require('./database');
const { getGroups } = require('./roblox');

function getRankSyncMappings(guildId) {
  return db.prepare('SELECT * FROM rank_sync WHERE guild_id = ? ORDER BY min_rank ASC').all(guildId);
}

function addRankSyncMapping(guildId, discordRoleId, minRank, robloxRoleName) {
  db.prepare('INSERT OR REPLACE INTO rank_sync (guild_id, discord_role_id, min_rank, roblox_role_name) VALUES (?, ?, ?, ?)')
    .run(guildId, discordRoleId, minRank, robloxRoleName || null);
}

function removeRankSyncMapping(guildId, discordRoleId) {
  return db.prepare('DELETE FROM rank_sync WHERE guild_id = ? AND discord_role_id = ?').run(guildId, discordRoleId);
}

function getVerifiedMembers(guildId) {
  return db.prepare('SELECT * FROM users WHERE guild_id = ?').all(guildId);
}

async function syncMember(guild, member, robloxId) {
  const g = getGuild(guild.id);
  if (!g.roblox_group_id) return;
  const mappings = getRankSyncMappings(guild.id);
  if (!mappings.length) return;

  const groupId = g.roblox_group_id;
  let userRank = 0;
  if (robloxId) {
    const groups = await getGroups(robloxId).catch(() => []);
    const membership = groups.find(grp => String(grp.group.id) === String(groupId));
    userRank = membership?.role?.rank ?? 0;
  }

  for (const { discord_role_id, min_rank } of mappings) {
    const role = guild.roles.cache.get(discord_role_id);
    if (!role) continue;
    const has = member.roles.cache.has(discord_role_id);
    const qualifies = userRank >= min_rank;
    if (qualifies && !has) await member.roles.add(role).catch(() => {});
    if (!qualifies && has) await member.roles.remove(role).catch(() => {});
  }
}

module.exports = { getRankSyncMappings, addRankSyncMapping, removeRankSyncMapping, getVerifiedMembers, syncMember };
