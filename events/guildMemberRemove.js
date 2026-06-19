'use strict';

const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const roles = member.roles?.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => `<@&${r.id}>`)
      .join(' ') || '—';

    const joinedAt = member.joinedTimestamp
      ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
      : 'unknown';

    await sendLog(member.guild, 'leave', {
      color: 0xED4245,
      content: [
        `🚪 **Left** — ${member.user} \`${member.user.username}\``,
        `-# Joined ${joinedAt} · Roles: ${roles}`,
      ].join('\n'),
    });
  },
};
