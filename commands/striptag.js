'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ok, err, card, COLORS }   = require('../utils/components');
const { getVerifyConfig, getAnyVerifyConfig, getAllLinkedUsers } = require('../utils/database');
const { getUserByUsername, getUserById, getGroupRoles, getUserRankInGroup, rankUser } = require('../utils/roblox');
const { isWhitelisted } = require('../utils/whitelist');
const { OWNER_IDS } = require('../utils/constants');

const category   = 'roblox';
const prefixName = 'striptag';
const aliases    = ['tagstrip', 'st'];

// Groups and the role to strip back to
const STRIP_GROUPS = [
  { groupId: '35914267',  baseRole: 'MEMBERS' },
  { groupId: '396910998', baseRole: 'Member'  },
];

async function getBaseRoleIds(cookie) {
  const result = [];
  for (const { groupId, baseRole } of STRIP_GROUPS) {
    const roles = await getGroupRoles(groupId, cookie);
    const found = roles.find(r => r.name.toLowerCase() === baseRole.toLowerCase());
    if (found) result.push({ groupId, roleId: found.id, baseRole });
  }
  return result;
}

async function stripOne(robloxId, baseRoles, cookie) {
  const results = [];
  for (const { groupId, roleId, baseRole } of baseRoles) {
    const membership = await getUserRankInGroup(robloxId, groupId).catch(() => null);
    if (!membership) { results.push({ groupId, skipped: true }); continue; }
    try {
      await rankUser(groupId, robloxId, roleId, cookie);
      results.push({ groupId, baseRole, ok: true });
    } catch (e) {
      results.push({ groupId, baseRole, ok: false, error: e.message });
    }
  }
  return results;
}

function isTagManager(member, authorId, guildId) {
  if (OWNER_IDS.includes(authorId)) return true;
  // In DMs there is no member/guild — only hardcoded owners pass
  if (!member || !guildId) return false;
  if (isWhitelisted(member, 'all')) return true;
  if (isWhitelisted(member, 'tags')) return true;
  if (isWhitelisted(member, 'roblox')) return true;
  const wl = require('../utils/database').getTagManagers(guildId);
  if (wl.users.includes(authorId)) return true;
  for (const roleId of member.roles.cache.keys()) {
    if (wl.roles.includes(roleId)) return true;
  }
  return false;
}

async function run(guildId, channel, target, reply) {
  const cfg = (guildId ? getVerifyConfig(guildId) : null) ?? getAnyVerifyConfig();
  if (!cfg?.cookie) return reply(err('No Roblox cookie set. Use `.setcookie <cookie>` first.'));

  await channel?.sendTyping?.().catch(() => {});

  let baseRoles;
  try {
    baseRoles = await getBaseRoleIds(cfg.cookie);
  } catch {
    return reply(err('Failed to fetch group roles from Roblox. Check the cookie is valid.'));
  }
  if (!baseRoles.length) return reply(err('Could not find **Unverified** / **Member** roles in the groups.'));

  // ── Everyone ──────────────────────────────────────────────────────────────
  if (target.toLowerCase() === 'everyone') {
    const linked = getAllLinkedUsers(guildId);
    if (!linked.length) return reply(err('No linked Roblox accounts found in this server.'));

    let stripped = 0, skipped = 0, failed = 0;
    for (const entry of linked) {
      if (!entry.roblox_id) { skipped++; continue; }
      const results = await stripOne(entry.roblox_id, baseRoles, cfg.cookie);
      if (results.some(r => r.ok))             stripped++;
      else if (results.every(r => r.skipped))  skipped++;
      else                                     failed++;
    }

    return reply(card({
      title: 'Strip Tag — Everyone',
      desc: [
        `**Stripped** ${stripped} users`,
        `**Not in group** ${skipped} users`,
        `**Failed** ${failed} users`,
      ].join('\n'),
      color: stripped > 0 ? 0x000000 : COLORS.red,
    }));
  }

  // ── Single user ───────────────────────────────────────────────────────────
  let robloxUser;
  try {
    robloxUser = /^\d+$/.test(target)
      ? await getUserById(target)
      : await getUserByUsername(target);
  } catch {
    return reply(err('Failed to reach the Roblox API.'));
  }
  if (!robloxUser) return reply(err(`No Roblox account found for **${target}**.`));

  const results = await stripOne(robloxUser.id, baseRoles, cfg.cookie);
  const lines   = results.map(r => {
    if (r.skipped) return `\`${r.groupId}\` — not in group, skipped`;
    if (r.ok)      return `\`${r.groupId}\` — set to **${r.baseRole}** ✅`;
    return `\`${r.groupId}\` — failed: ${r.error}`;
  });

  return reply(card({
    title: results.some(r => r.ok) ? `Strip Tag — ${robloxUser.name}` : 'Strip Tag — Nothing changed',
    desc:  lines.join('\n'),
    color: results.some(r => r.ok) ? 0x000000 : COLORS.red,
  }));
}

// ── Prefix ────────────────────────────────────────────────────────────────────

async function prefixExecute(message, args) {
  if (!isTagManager(message.member, message.author.id, message.guild?.id))
    return message.reply(err('You are not authorised to use this command.'));

  const target = args.join(' ').trim();
  if (!target) return message.reply(card({
    title: 'striptag — Usage',
    desc:  [
      '`.striptag <roblox username>` — strip one user back to Unverified / Member',
      '`.striptag everyone` — strip all linked users in the server',
    ].join('\n'),
    color: 0x000000,
  }));

  return run(message.guild?.id ?? null, message.channel, target, p => message.reply(p));
}

// ── Slash ─────────────────────────────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName('striptag')
  .setDescription('Strip a Roblox user\'s tag back to Unverified / Member')
  .addStringOption(o =>
    o.setName('target')
      .setDescription('Roblox username, or type "everyone" to strip all linked users')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  if (!isTagManager(interaction.member, interaction.user.id, interaction.guild.id))
    return interaction.reply({ ...err('You are not authorised to use this command.'), ephemeral: true });

  await interaction.deferReply();
  const target = interaction.options.getString('target');
  return run(interaction.guild.id, interaction.channel, target, p => interaction.editReply(p));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
