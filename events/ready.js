'use strict';

const { startSniperLoop }    = require('../handlers/sniperHandler');
const { startGiveawayLoop }  = require('../handlers/giveawayHandler');
const { startReminderLoop }  = require('../handlers/reminderHandler');
const { setupAntiNukeListeners } = require('../handlers/antiNuke');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[Ready] Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'the server' }], status: 'online' });

    startSniperLoop(client);
    startGiveawayLoop(client);
    startReminderLoop(client);
    setupAntiNukeListeners(client);
  },
};
