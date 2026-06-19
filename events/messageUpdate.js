'use strict';

const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendLog(newMessage.guild, 'messages', {
      color: 0xFEE75C,
      content: [
        `✏️ **Message edited** — ${newMessage.author} in ${newMessage.channel}`,
        `**Before:** ${oldMessage.content?.slice(0, 400) || '*empty*'}`,
        `**After:** ${newMessage.content?.slice(0, 400) || '*empty*'}`,
      ].join('\n'),
    });
  },
};
