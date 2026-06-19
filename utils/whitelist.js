'use strict';

const { isUserWhitelisted, isRoleWhitelisted, hasAnyUserWhitelist, hasAnyRoleWhitelist } = require('./database');
const { OWNER_IDS } = require('./constants');

/**
 * Global bot access gate — runs before any command check.
 * Returns true if the member is a bot owner, server owner, or has
 * ANY whitelist entry for this guild. Non-whitelisted users are
 * silently ignored (caller should just return without responding).
 */
function hasBotAccess(member) {
  if (!member || !member.guild) return false;
  if (OWNER_IDS.includes(member.id)) return true;
  if (member.id === member.guild.ownerId) return true;

  const guildId = member.guild.id;
  if (hasAnyUserWhitelist(guildId, member.id)) return true;

  for (const [roleId] of member.roles.cache) {
    if (hasAnyRoleWhitelist(guildId, roleId)) return true;
  }

  return false;
}

/**
 * Checks whether a guild member is permitted to use a given category.
 * Bot owners and server owners bypass all whitelist checks.
 */
function isWhitelisted(member, category) {
  if (!member || !member.guild) return false;
  if (OWNER_IDS.includes(member.id)) return true;
  if (member.id === member.guild.ownerId) return true;

  const guildId = member.guild.id;

  if (isUserWhitelisted(guildId, member.id, category)) return true;

  for (const [roleId] of member.roles.cache) {
    if (isRoleWhitelisted(guildId, roleId, category)) return true;
  }

  return false;
}

module.exports = { isWhitelisted, hasBotAccess };
