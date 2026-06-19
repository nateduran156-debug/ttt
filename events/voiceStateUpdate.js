'use strict';

const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const { guild, member } = newState;
    if (!member || member.user.bot) return;

    const oldCh = oldState.channel;
    const newCh = newState.channel;

    if (!oldCh && newCh) {
      await sendLog(guild, 'voice', {
        color: 0x57F287,
        content: `🔊 **Joined voice** — ${member.user} → **${newCh.name}**`,
      });
    } else if (oldCh && !newCh) {
      await sendLog(guild, 'voice', {
        color: 0xED4245,
        content: `🔇 **Left voice** — ${member.user} ← **${oldCh.name}**`,
      });
    } else if (oldCh && newCh && oldCh.id !== newCh.id) {
      await sendLog(guild, 'voice', {
        color: 0xFEE75C,
        content: `🔀 **Moved voice** — ${member.user}: **${oldCh.name}** → **${newCh.name}**`,
      });
    }
  },
};
