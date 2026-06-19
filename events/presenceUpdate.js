'use strict';

const { getOppVanities, getVanitySettings } = require('../utils/database');
const C = require('../utils/components');
const logger = require('../utils/logger');

module.exports = {
  name: 'presenceUpdate',
  async execute(oldPresence, newPresence, client) {
    if (!newPresence?.guild) return;

    const guildId  = newPresence.guild.id;
    const vanities = getOppVanities(guildId);
    if (vanities.length === 0) return;

    const settings = getVanitySettings(guildId);
    if (!settings?.channel_id) return;

    const activities = newPresence.activities ?? [];
    const custom     = activities.find(a => a.type === 4);
    if (!custom?.state) return;

    const oldCustom = oldPresence?.activities?.find(a => a.type === 4);
    if (oldCustom?.state === custom.state) return;

    const statusText = custom.state.toLowerCase();

    for (const { vanity } of vanities) {
      const variations = [
        `discord.gg/${vanity}`,
        `.gg/${vanity}`,
        `/${vanity}`,
        vanity,
      ];

      if (!variations.some(v => statusText.includes(v.toLowerCase()))) continue;

      const channel = client.channels.cache.get(settings.channel_id);
      if (!channel) return;

      const member      = newPresence.member;
      const user        = member?.user ?? newPresence.user;
      if (!user) return;

      const displayName = member?.displayName ?? user.globalName ?? user.username;
      const username    = user.username ?? 'Unknown';
      const userId      = user.id;

      const pingPart = settings.ping_enabled && settings.ping_role_id
        ? `<@&${settings.ping_role_id}>`
        : undefined;

      try {
        await channel.send({
          content: pingPart,
          ...C.card({
            title: 'Opp Vanity Detected',
            desc: [
              `**User** <@${userId}> — **${displayName}** (\`${username}\`)`,
              `**ID** \`${userId}\``,
              `**Vanity** \`discord.gg/${vanity}\``,
              `**Status** "${custom.state}"`,
            ].join('\n'),
            color: C.COLORS.red,
          }),
        });
        logger.info(`Vanity alert sent: ${username} repping discord.gg/${vanity} in guild ${guildId}`);
      } catch (e) {
        logger.warn(`Vanity watcher: failed to send alert: ${e.message}`);
      }

      break;
    }
  },
};
