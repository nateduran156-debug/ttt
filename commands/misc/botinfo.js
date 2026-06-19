'use strict';

const { card, COLORS } = require('../../utils/components');
const os               = require('os');

const category   = 'misc';
const prefixName = 'botinfo';
const aliases    = ['bi', 'about', 'info'];

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
}

async function prefixExecute(message) {
  const client = message.client;
  const mem    = process.memoryUsage();
  const usedMb = (mem.heapUsed / 1024 / 1024).toFixed(1);

  return message.reply(card({
    title: client.user.username,
    fields: [
      { name: 'Servers',  value: `${client.guilds.cache.size}` },
      { name: 'Users',    value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}` },
      { name: 'Uptime',   value: formatUptime(process.uptime() * 1000) },
      { name: 'Memory',   value: `${usedMb} MB` },
      { name: 'Node.js',  value: process.version },
      { name: 'Platform', value: `${os.type()} ${os.arch()}` },
    ],
    color: COLORS.blue,
    footer: `discord.js v${require('discord.js').version}`,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('show information about the bot');

async function execute(interaction) {
  return prefixExecute(interaction, []);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
