'use strict';

const { getPendingReminders, markReminderFired } = require('../utils/database');
const { card, COLORS }                            = require('../utils/components');

function startReminderLoop(client) {
  setInterval(() => checkReminders(client), 30_000);
}

async function checkReminders(client) {
  const pending = getPendingReminders();
  for (const reminder of pending) {
    markReminderFired(reminder.id);
    try {
      const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
      if (!channel) continue;
      const payload = card({
        title: '⏰ Reminder',
        desc:  reminder.message,
        color: COLORS.blue,
        footer: `Set at <t:${reminder.created_at}:f>`,
      });
      await channel.send({ content: `<@${reminder.user_id}>`, ...payload });
    } catch (e) {
      console.error(`[Reminder] Error: ${e.message}`);
    }
  }
}

module.exports = { startReminderLoop };
