'use strict';

const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    const content = message.content?.slice(0, 800) || '*No text content*';

    await sendLog(message.guild, 'messages', {
      color: 0xFF6B35,
      content: [
        `🗑️ **Message deleted** — ${message.author ?? '*Unknown*'} in ${message.channel}`,
        content,
      ].join('\n'),
    });
  },
};
