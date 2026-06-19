'use strict';

const { card, COLORS } = require('../../utils/components');

const category   = 'misc';
const prefixName = 'ping';
const aliases    = ['p', 'latency'];

async function prefixExecute(message) {
  const sent  = await message.reply(card({ title: 'Pinging…', color: COLORS.gray }));
  const latency = sent.createdTimestamp - message.createdTimestamp;
  const ws      = message.client.ws.ping;

  await sent.edit(card({
    title: '🏓 Pong!',
    desc:  `**Message latency** ${latency}ms\n**WebSocket heartbeat** ${ws}ms`,
    color: latency < 150 ? COLORS.green : latency < 400 ? COLORS.yellow : COLORS.red,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('check the bot\'s response time and websocket latency');

async function execute(interaction) {
  const sent    = await interaction.reply({ content: 'Pinging…', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const ws      = interaction.client.ws.ping;
  await interaction.editReply(card({
    title:  'Pong!',
    fields: [
      { name: 'Roundtrip', value: `**${latency}ms**`, inline: true },
      { name: 'Websocket', value: `**${ws}ms**`,      inline: true },
    ],
    color: COLORS.green,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
