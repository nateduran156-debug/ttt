'use strict';

const ms = require('ms');

function parseDuration(str) {
  const parsed = ms(str);
  if (!parsed || isNaN(parsed)) return null;
  return parsed;
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (days > 0)    return `${days}d ${hours % 24}h`;
  if (hours > 0)   return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function timestamp(msVal, style = 'R') {
  return `<t:${Math.floor(msVal / 1000)}:${style}>`;
}

function relativeTime(msVal) {
  return `<t:${Math.floor(msVal / 1000)}:R>`;
}

module.exports = { parseDuration, formatDuration, timestamp, relativeTime };
