'use strict';

const { getAllSniperTargets }                        = require('../utils/database');
const { getUserPresence, getHeadshot, getGameInfo }  = require('../utils/roblox');
const { CV2, COLORS, C }                             = require('../utils/components');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

// Cache stores: userId -> { presence, gameId, placeId }
// Only clears when they go offline, so rejoining same server won't re-notify.
// A new gameId (different server/game) WILL trigger a new notification.
const presenceCache = new Map();

const S = (divider = true) =>
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(divider);

function startSniperLoop(client) {
  setInterval(() => runSniperCheck(client), 30_000);
  console.log('[Sniper] Username sniper started — checking every 30 seconds.');
}

async function runSniperCheck(client) {
  const targets = getAllSniperTargets();
  if (!targets.length) return;

  const uniqueIds = [...new Set(targets.map(t => t.roblox_id).filter(Boolean))];
  if (!uniqueIds.length) return;

  let presences;
  try {
    presences = await getUserPresence(uniqueIds.map(Number));
  } catch {
    return;
  }

  for (const presence of presences) {
    const userId   = String(presence.userId);
    const prev     = presenceCache.get(userId);
    const isOnline = presence.userPresenceType >= 1;

    if (!isOnline) {
      // Went offline — clear cache
      if (prev) presenceCache.delete(userId);
      continue;
    }

    // Online — check if this is a new session or a different game server
    const currentGameId   = presence.gameId   ?? null;
    const currentPlaceId  = presence.rootPlaceId ?? null;

    const isNewOnline     = !prev;
    const gameChanged     = prev && (currentGameId !== prev.gameId);

    if (!isNewOnline && !gameChanged) {
      // Same game session — don't notify again
      continue;
    }

    // Update cache with new presence info
    presenceCache.set(userId, { presence, gameId: currentGameId, placeId: currentPlaceId });

    const relTargets = targets.filter(t => t.roblox_id === userId);
    for (const target of relTargets) {
      await notifySniper(client, target, presence);
    }
  }
}

async function notifySniper(client, target, presence) {
  try {
    const channel = await client.channels.fetch(target.channel_id).catch(() => null);
    if (!channel) return;

    const headshotUrl = await getHeadshot(target.roblox_id).catch(() => null);
    let gameInfo = null;
    if (presence.universeId) {
      gameInfo = await getGameInfo(presence.universeId).catch(() => null);
    }

    const gameName   = gameInfo?.name ?? presence.lastLocation ?? null;
    const statusLine = presenceText(presence, gameInfo);

    const sectionLines = [
      `**${target.roblox_username} is online**`,
      `status ${statusLine}`,
    ];
    if (gameName && presence.userPresenceType === 2) {
      sectionLines.push(`game **${gameName}**`);
    }

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(sectionLines.join('\n')));

    if (headshotUrl) {
      section.setThumbnailAccessory(new ThumbnailBuilder().setURL(headshotUrl));
    }

    const container = new ContainerBuilder()
      .setAccentColor(0x000000)
      .addSectionComponents(section)
      .addSeparatorComponents(S())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**roblox id** \`${target.roblox_id}\``)
      )
      .addSeparatorComponents(S(false))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:T>`)
      );

    const buttons = [];

    // Join button — only when in a game with a valid server instance
    if (presence.userPresenceType === 2 && presence.rootPlaceId && presence.gameId) {
      buttons.push(
        new ButtonBuilder()
          .setLabel('Join')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/games/start?placeId=${presence.rootPlaceId}&gameInstanceId=${presence.gameId}`)
      );
    }

    // Mention the person who added this sniper target
    const mentionParts = [];
    if (target.notify_role) mentionParts.push(`<@&${target.notify_role}>`);
    if (target.added_by)    mentionParts.push(`<@${target.added_by}>`);
    const content = mentionParts.length ? mentionParts.join(' ') : null;

    const components = [container];
    if (buttons.length) {
      components.push(new ActionRowBuilder().addComponents(...buttons));
    }

    await channel.send({
      content,
      flags: MessageFlags.IsComponentsV2,
      components,
    });
  } catch (e) {
    console.error(`[Sniper] Notification error for ${target.roblox_username}: ${e.message}`);
  }
}

function presenceText(p, gameInfo) {
  switch (p.userPresenceType) {
    case 1: return 'On Website';
    case 2: return `In Game${gameInfo ? ` — ${gameInfo.name}` : (p.lastLocation ? ` — ${p.lastLocation}` : '')}`;
    case 3: return `In Studio${p.lastLocation ? ` — ${p.lastLocation}` : ''}`;
    default: return 'Offline';
  }
}

module.exports = { startSniperLoop };
