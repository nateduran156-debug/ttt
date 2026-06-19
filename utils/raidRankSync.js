'use strict';

const { getRaidRankRoles } = require('./database');

async function applyRaidRankRoles(guild, member, raidPoints) {
  const roles = getRaidRankRoles(guild.id);
  for (const { role_id, threshold } of roles) {
    const role = guild.roles.cache.get(role_id);
    if (!role) continue;
    const hasIt = member.roles.cache.has(role_id);
    if (raidPoints >= threshold && !hasIt) {
      await member.roles.add(role).catch(() => {});
    } else if (raidPoints < threshold && hasIt) {
      await member.roles.remove(role).catch(() => {});
    }
  }
}

module.exports = { applyRaidRankRoles };
