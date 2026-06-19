'use strict';

const { getRankRolesFromDB, addRankRoleToDB, removeRankRoleFromDB } = require('./database');

function getRankRoles(guildId) {
  return getRankRolesFromDB(guildId);
}

function addRankRole(guildId, roleId, threshold) {
  addRankRoleToDB(guildId, roleId, threshold);
}

function removeRankRole(guildId, roleId) {
  return removeRankRoleFromDB(guildId, roleId);
}

/**
 * Syncs a member's roles based on their current rank point total.
 * Assigns all roles whose thresholds have been met, removes those that haven't.
 */
async function applyRankRoles(guild, member, points) {
  const roles = getRankRoles(guild.id);
  for (const { role_id, threshold } of roles) {
    const role = guild.roles.cache.get(role_id);
    if (!role) continue;
    const hasIt = member.roles.cache.has(role_id);
    if (points >= threshold && !hasIt) {
      await member.roles.add(role).catch(() => {});
    } else if (points < threshold && hasIt) {
      await member.roles.remove(role).catch(() => {});
    }
  }
}

module.exports = { getRankRoles, addRankRole, removeRankRole, applyRankRoles };
