'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { getGuild } = require('./database');

const CV2 = MessageFlags.IsComponentsV2;

const LOG_CHANNEL_MAP = {
  join:     'join_log_channel',
  leave:    'leave_log_channel',
  messages: 'message_log_channel',
  voice:    'voice_log_channel',
  mod:      'mod_log_channel',
  general:  'log_channel',
};

/**
 * Sends a formatted log message to the appropriate configured channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {'join'|'leave'|'messages'|'voice'|'mod'|'general'} type
 * @param {{ color?: number, content: string }} opts
 */
async function sendLog(guild, type, { color = 0x5865F2, content }) {
  try {
    const g       = getGuild(guild.id);
    const field   = LOG_CHANNEL_MAP[type] || 'log_channel';
    const chanId  = g[field] || g.log_channel;
    if (!chanId) return;

    const ch = guild.channels.cache.get(chanId);
    if (!ch) return;

    const container = new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:T>`));

    await ch.send({ flags: CV2, components: [container] });
  } catch {
    // Silently ignore logging failures so they don't disrupt normal operations
  }
}

module.exports = { sendLog };
