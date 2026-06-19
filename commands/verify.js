'use strict';

const {
  getVerifyConfig, setVerifyConfig,
  getVerifiedUser, setVerifiedUser, removeVerifiedUser,
} = require('../utils/database');
const {
  getUserByUsername, getAuthenticatedUser,
} = require('../utils/roblox');
const { ok, err, card, COLORS }     = require('../utils/components');
const { PermissionFlagsBits }        = require('discord.js');
const { sendLog }                    = require('../utils/logger');

const category   = 'verify';
const prefixName = 'verify';
const aliases    = ['v', 'rverify'];

async function prefixExecute(message, args) {
  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();
  const cfg     = getVerifyConfig(guildId);

  // ── .verify setup ─────────────────────────────────────────────────────────
  if (sub === 'setup') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply(err('You need the **Manage Server** permission.'));

    const role = message.mentions.roles.first();
    const ch   = message.mentions.channels.first();

    if (role) setVerifyConfig(guildId, { verified_role: role.id });
    if (ch)   setVerifyConfig(guildId, { log_channel: ch.id });

    return message.reply(ok(
      `Verification configured.\n${role ? `Verified role: ${role}\n` : ''}${ch ? `Log channel: ${ch}` : ''}`
    ));
  }

  // ── .verify setcookie ─────────────────────────────────────────────────────
  if (sub === 'setcookie') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply(err('You need the **Administrator** permission.'));
    const cookie = args[1];
    if (!cookie) return message.reply(err('Provide the Roblox cookie.'));
    setVerifyConfig(guildId, { cookie });
    await message.delete().catch(() => {});
    return message.channel.send(ok('Cookie stored securely. The message containing it has been deleted.'));
  }

  // ── .verify <roblox_username> ─────────────────────────────────────────────
  const username = sub;
  if (!username) {
    return message.reply(card({
      title: 'Verify — Usage',
      desc: [
        '`.verify <roblox_username>` — link your Roblox account',
        '`.verify unlink` — remove your verification',
        '`.verify check [@user]` — check a user\'s linked account',
        '`.verify setup @role [#log_channel]` — configure verification (requires Manage Server)',
      ].join('\n'),
      color: COLORS.blue,
    }));
  }

  if (sub === 'unlink') {
    removeVerifiedUser(guildId, message.author.id);
    return message.reply(ok('Your Roblox account has been unlinked.'));
  }

  if (sub === 'check') {
    const target = message.mentions.users.first() || message.author;
    const linked = getVerifiedUser(guildId, target.id);
    if (!linked) return message.reply(card({ title: 'Verification', desc: `${target.username} has no linked Roblox account.`, color: COLORS.gray }));
    return message.reply(card({
      title: `${target.username}'s Roblox Account`,
      desc: `**Username** ${linked.roblox_name}\n**ID** \`${linked.roblox_id}\`\n**Verified** <t:${linked.verified_at}:R>`,
      color: COLORS.green,
    }));
  }

  // Attempt to link the account
  let robloxUser;
  try {
    robloxUser = await getUserByUsername(username);
  } catch {
    return message.reply(err('Failed to reach the Roblox API. Please try again later.'));
  }

  if (!robloxUser) return message.reply(err(`No Roblox account found for username **${username}**.`));

  setVerifiedUser(guildId, message.author.id, String(robloxUser.id), robloxUser.name);

  // Assign the verified role if configured
  if (cfg?.verified_role) {
    const role = message.guild.roles.cache.get(cfg.verified_role);
    if (role) {
      await message.member.roles.add(role).catch(() => {});

      // Rename to Roblox username
      await message.member.setNickname(robloxUser.name).catch(() => {});
    }
  }

  await sendLog(message.guild, 'general', {
    color: COLORS.green,
    content: `✅ **Verified** — ${message.author} linked to Roblox account **${robloxUser.name}** (\`${robloxUser.id}\`)`,
  });

  return message.reply(ok(`Successfully linked to **${robloxUser.name}** (ID: \`${robloxUser.id}\`).`));
}

module.exports = { prefixName, aliases, category, prefixExecute };
