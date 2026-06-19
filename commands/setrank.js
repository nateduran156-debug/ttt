'use strict';

const { getRaidRankRoles, addRaidRankRole, removeRaidRankRole } = require('../utils/database');
const { ok, err, card, COLORS } = require('../utils/components');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'raidpoints';
const prefixName = 'setrank';
const aliases    = ['sr', 'rankset'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();

  if (sub === 'list') {
    const roles = getRaidRankRoles(guildId);
    if (!roles.length) {
      return message.reply(card({
        title: 'Raid Rank Roles',
        desc:  'No rank roles set up yet. Use `.setrank <role_id> <points>` to add one.',
        color: COLORS.black,
      }));
    }
    const lines = roles
      .sort((a, b) => a.threshold - b.threshold)
      .map(r => `<@&${r.role_id}> — **${r.threshold}** raid pts`)
      .join('\n');
    return message.reply(card({ title: 'Raid Rank Roles', desc: lines, color: COLORS.black }));
  }

  if (sub === 'remove') {
    const roleId = args[1];
    if (!roleId) {
      return message.reply(err('Provide a role ID.\nUsage: `.setrank remove <role_id>`'));
    }
    const result = removeRaidRankRole(guildId, roleId);
    if (!result.changes) return message.reply(err('No rank role found with that ID.'));
    return message.reply(ok(`Removed rank role <@&${roleId}> from the auto-promo list.`));
  }

  const roleId    = args[0];
  const threshold = parseInt(args[1]);

  if (!roleId || isNaN(threshold) || threshold < 1) {
    return message.reply(card({
      title: 'setrank — Usage',
      desc: [
        '`.setrank <role_id> <points>` — set a raid points threshold for auto-promo',
        '`.setrank list` — view all rank roles',
        '`.setrank remove <role_id>` — delete a rank role',
        '',
        '**How it works:** when a member\'s raid points reach the threshold they',
        'automatically receive the role. if their points drop below it, the role',
        'is stripped automatically.',
      ].join('\n'),
      color: COLORS.black,
    }));
  }

  const role = message.guild.roles.cache.get(roleId);
  if (!role) return message.reply(err(`No role found with ID \`${roleId}\`. Make sure to paste the raw ID.`));

  addRaidRankRole(guildId, roleId, threshold);
  return message.reply(ok(
    `${role} will now be automatically granted at **${threshold}** raid points.\n` +
    `If a member drops below that amount the role is stripped automatically.`
  ));
}

module.exports = { prefixName, aliases, category, prefixExecute };
