// ─────────────────────────────────────────────────────────────────────────────
// Application Emoji Config
// Upload emojis at: discord.com/developers → Applications → your app → Emojis
// Name them to match the keys below (e.g. ban, kick, warn, timeout, etc.)
// The bot fetches them automatically at startup — no manual ID entry needed.
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK = {
  ban:     '🔨', kick:    '👢', unban:   '✅', warn:    '⚠️',
  timeout: '⏱️', unmute:  '🔔', note:    '📝', history: '📋',
  softban: '🚪', tempban: '⏳', massban: '🔁',
  lock:    '🔒', unlock:  '🔓', slow:    '🐌', purge:   '🗑️',
  nuke:    '💥', move:    '🔀', role:    '🎭', nick:    '✏️',
  deafen:  '🔇', mute:    '🔕', create:  '➕', delete:  '➖',
  check:   '✅', deny:    '❌', load:    '⏳', info:    'ℹ️',
  mod:     '🔨', shield:  '🛡️', roblox:  '🎮', star:    '⭐',
  sword:   '⚔️', link:    '🔗', sniper:  '🎯', chart:   '📊',
  party:   '🎉', ticket:  '🎫', wave:    '👋', log:     '📋',
  robot:   '🤖',
};

// Populated at startup via initEmojis(client)
const appEmojiCache = new Map();

export async function initEmojis(client) {
  try {
    const emojis = await client.application.emojis.fetch();
    appEmojiCache.clear();
    for (const emoji of emojis.values()) {
      appEmojiCache.set(emoji.name, emoji);
    }
    const names = [...appEmojiCache.keys()].join(', ');
    console.log(`[emojis] loaded ${appEmojiCache.size} application emoji(s)${names ? ': ' + names : ''}`);
  } catch (err) {
    console.warn('[emojis] could not fetch application emojis:', err.message);
  }
}

export function e(name) {
  const emoji = appEmojiCache.get(name);
  if (emoji) return `<:${emoji.name}:${emoji.id}>`;
  return FALLBACK[name] ?? '•';
}
