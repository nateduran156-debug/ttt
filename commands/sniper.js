'use strict';

const {
  addSniperTarget, removeSniperTarget,
  getSniperTarget, getSniperTargetsByGuild,
  updateSniperTargetChannel,
} = require('../utils/database');
const { getUserByUsername }           = require('../utils/roblox');
const { ok, err, card, COLORS, CV2 } = require('../utils/components');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

const category   = 'sniper';
const prefixName = 'sniper';
const aliases    = ['sn'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

async function prefixExecute(message, args) {
  const sub = args[0]?.toLowerCase();

  // ── .sniper add <username> [server_link] [notify_role] ──────────────────
  if (sub === 'add') {
    const username = args[1];
    if (!username) return message.reply(err('Provide a Roblox username.\nUsage: `.sniper add <username> [discord_invite] [@role]`'));

    await message.channel.sendTyping().catch(() => {});

    let robloxUser;
    try {
      robloxUser = await getUserByUsername(username);
    } catch {
      return message.reply(err('Failed to reach the Roblox API. Please try again later.'));
    }

    if (!robloxUser) return message.reply(err(`No Roblox account found for username **${username}**.`));

    const serverLink = args[2] && args[2].startsWith('http') ? args[2] : null;
    const notifyRole = message.mentions.roles.first()?.id || null;

    addSniperTarget({
      guildId:       message.guild.id,
      channelId:     message.channel.id,
      robloxId:      String(robloxUser.id),
      robloxUsername:robloxUser.name,
      serverLink,
      notifyRole,
      addedBy:       message.author.id,
    });

    return message.reply(ok(
      `Now sniping **${robloxUser.name}** (ID: \`${robloxUser.id}\`).\n` +
      `Alerts will be posted in ${message.channel}.` +
      (serverLink ? `\nJoin Server button → ${serverLink}` : '') +
      (notifyRole ? `\nRole ping: <@&${notifyRole}>` : '')
    ));
  }

  // ── .sniper remove <username> ────────────────────────────────────────────
  if (sub === 'remove' || sub === 'delete') {
    const username = args[1];
    if (!username) return message.reply(err('Provide a Roblox username to remove.'));

    // Find by username (case-insensitive)
    const targets = getSniperTargetsByGuild(message.guild.id);
    const target  = targets.find(t => t.roblox_username.toLowerCase() === username.toLowerCase());

    if (!target) return message.reply(err(`No sniper target found for **${username}**.`));

    removeSniperTarget(message.guild.id, target.roblox_id);
    return message.reply(ok(`Stopped sniping **${target.roblox_username}**.`));
  }

  // ── .sniper channel <username> ───────────────────────────────────────────
  if (sub === 'channel') {
    const username = args[1];
    if (!username) return message.reply(err('Provide a Roblox username.'));

    const targets = getSniperTargetsByGuild(message.guild.id);
    const target  = targets.find(t => t.roblox_username.toLowerCase() === username.toLowerCase());
    if (!target) return message.reply(err(`No sniper target found for **${username}**.`));

    updateSniperTargetChannel(message.guild.id, target.roblox_id, message.channel.id);
    return message.reply(ok(`Alerts for **${target.roblox_username}** will now post in ${message.channel}.`));
  }

  // ── .sniper list ─────────────────────────────────────────────────────────
  if (!sub || sub === 'list') {
    const targets = getSniperTargetsByGuild(message.guild.id);
    if (!targets.length) {
      return message.reply(card({
        title: 'Sniper Targets',
        desc:  'No targets configured. Use `.sniper add <username>` to add one.',
        color: COLORS.purple,
      }));
    }

    const c = new ContainerBuilder()
      .setAccentColor(COLORS.purple)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Sniper Targets — ${targets.length}`))
      .addSeparatorComponents(S())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        targets.map((t, i) =>
          `**${i + 1}.** ${t.roblox_username} \`${t.roblox_id}\` → <#${t.channel_id}>`
        ).join('\n')
      ));

    return message.reply({ flags: require('discord.js').MessageFlags.IsComponentsV2, components: [c] });
  }

  return message.reply(card({
    title: 'Sniper — Usage',
    desc: [
      '`.sniper add <username> [discord_invite] [@role]` — start sniping a Roblox user',
      '`.sniper remove <username>` — stop sniping a user',
      '`.sniper channel <username>` — change the alert channel to the current channel',
      '`.sniper list` — view all active sniper targets',
    ].join('\n'),
    color: COLORS.purple,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('snipe')
  .setDescription('show the most recently deleted message in this channel');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
