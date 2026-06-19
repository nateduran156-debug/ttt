'use strict';

const { getAutomodConfig } = require('../utils/database');
const { sendLog }           = require('../utils/logger');

const spamTracker = new Map(); // userId → [timestamps]

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (message.member?.permissions.has('ManageMessages')) return;

    const cfg = getAutomodConfig(message.guild.id);
    if (!cfg?.enabled) return;

    const whitelistRoles    = JSON.parse(cfg.whitelist_roles    || '[]');
    const whitelistChannels = JSON.parse(cfg.whitelist_channels || '[]');

    if (whitelistChannels.includes(message.channel.id)) return;
    if (message.member?.roles.cache.some(r => whitelistRoles.includes(r.id))) return;

    const content = message.content;
    const reasons = [];

    // ── Spam detection ───────────────────────────────────────────────────────
    const key     = `${message.guild.id}:${message.author.id}`;
    const now     = Date.now();
    const window  = cfg.spam_window || 5000;
    const times   = (spamTracker.get(key) || []).filter(t => now - t < window);
    times.push(now);
    spamTracker.set(key, times);

    if (times.length >= (cfg.spam_threshold || 5)) {
      reasons.push('spam (too many messages in a short period)');
      spamTracker.set(key, []);
    }

    // ── Caps detection ───────────────────────────────────────────────────────
    if (content.length >= 8) {
      const upper = content.replace(/[^a-zA-Z]/g, '');
      if (upper.length > 0) {
        const capPct = (content.replace(/[^A-Z]/g, '').length / upper.length) * 100;
        if (capPct >= (cfg.caps_threshold || 70)) {
          reasons.push('excessive capital letters');
        }
      }
    }

    // ── Link detection ───────────────────────────────────────────────────────
    if (cfg.link_mode === 'block' && /https?:\/\/\S+/.test(content)) {
      reasons.push('links are not permitted in this server');
    }

    // ── Bad words ────────────────────────────────────────────────────────────
    const badWords = JSON.parse(cfg.bad_words || '[]');
    const lower    = content.toLowerCase();
    for (const word of badWords) {
      if (lower.includes(word.toLowerCase())) {
        reasons.push(`prohibited language`);
        break;
      }
    }

    // ── Mention spam ─────────────────────────────────────────────────────────
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount >= (cfg.mention_limit || 5)) {
      reasons.push('excessive mentions');
    }

    if (!reasons.length) return;

    await message.delete().catch(() => {});

    const warn = await message.channel.send({
      content: `⚠️ ${message.author}, your message was removed — **${reasons[0]}**.`,
    }).catch(() => null);

    if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

    if (cfg.log_channel) {
      await sendLog(message.guild, 'general', {
        color: 0xFF6B35,
        content: `🔧 **AutoMod** removed a message from ${message.author}\n**Reason:** ${reasons.join(', ')}\n**Content:** ${content.slice(0, 200)}`,
      });
    }
  },
};
