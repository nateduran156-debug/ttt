'use strict';

const { getActiveGiveaways, updateGiveaway } = require('../utils/database');
const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

const CV2 = MessageFlags.IsComponentsV2;

function startGiveawayLoop(client) {
  setInterval(() => checkGiveaways(client), 15_000);
}

async function checkGiveaways(client) {
  const now     = Math.floor(Date.now() / 1000);
  const expired = getActiveGiveaways().filter(gw => gw.ends_at <= now);
  for (const gw of expired) {
    await endGiveaway(client, gw);
  }
}

async function endGiveaway(client, giveaway) {
  updateGiveaway(giveaway.id, { status: 'ended', ended_at: Math.floor(Date.now() / 1000) });

  const entries = JSON.parse(giveaway.entries || '[]');
  const count   = Math.min(giveaway.winners, entries.length);
  const winners = [...entries].sort(() => Math.random() - 0.5).slice(0, count);
  updateGiveaway(giveaway.id, { winner_ids: JSON.stringify(winners) });

  try {
    const ch = await client.channels.fetch(giveaway.channel_id).catch(() => null);
    if (!ch) return;

    if (giveaway.message_id) {
      const msg = await ch.messages.fetch(giveaway.message_id).catch(() => null);
      if (msg) {
        const c = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 🎉 Giveaway ended — ${giveaway.prize}\n` +
            (winners.length
              ? `**Winners:** ${winners.map(w => `<@${w}>`).join(', ')}`
              : 'No valid entries were recorded.')
          )
        );
        await msg.edit({ flags: CV2, components: [c] }).catch(() => {});
      }
    }

    const text = winners.length
      ? `🎉 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**.`
      : `😔 Nobody entered the **${giveaway.prize}** giveaway.`;

    await ch.send({ content: text });
  } catch (e) {
    console.error(`[Giveaway] End error: ${e.message}`);
  }
}

module.exports = { startGiveawayLoop, endGiveaway };
