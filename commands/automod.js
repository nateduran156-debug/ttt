'use strict';

const { getAutomodConfig, setAutomodConfig } = require('../utils/database');
const { ok, err, card, COLORS, CV2 }          = require('../utils/components');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionFlagsBits,
} = require('discord.js');

const category   = 'automod';
const prefixName = 'automod';
const aliases    = ['am'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

function displayConfig(cfg) {
  const c = new ContainerBuilder()
    .setAccentColor(cfg?.enabled ? COLORS.green : COLORS.gray)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## AutoMod Configuration'))
    .addSeparatorComponents(S())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `**Status** ${cfg?.enabled ? '✅ Enabled' : '❌ Disabled'}`,
      `**Log Channel** ${cfg?.log_channel ? `<#${cfg.log_channel}>` : 'Not set'}`,
      `**Spam** ${cfg?.spam_threshold ?? 5} messages / ${(cfg?.spam_window ?? 5000) / 1000}s`,
      `**Caps Threshold** ${cfg?.caps_threshold ?? 70}%`,
      `**Link Mode** ${cfg?.link_mode ?? 'off'}`,
      `**Mention Limit** ${cfg?.mention_limit ?? 5}`,
      `**Bad Words** ${JSON.parse(cfg?.bad_words || '[]').length} entries`,
    ].join('\n')));
  return { flags: require('discord.js').MessageFlags.IsComponentsV2, components: [c] };
}

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();

  if (!sub || sub === 'config' || sub === 'status') {
    return message.reply(displayConfig(getAutomodConfig(guildId)));
  }

  if (sub === 'enable') {
    setAutomodConfig(guildId, { enabled: 1 });
    return message.reply(ok('AutoMod has been **enabled**.'));
  }

  if (sub === 'disable') {
    setAutomodConfig(guildId, { enabled: 0 });
    return message.reply(ok('AutoMod has been **disabled**.'));
  }

  if (sub === 'logchannel' || sub === 'log') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply(err('Mention a channel.'));
    setAutomodConfig(guildId, { log_channel: ch.id });
    return message.reply(ok(`AutoMod logs will be sent to ${ch}.`));
  }

  if (sub === 'spam') {
    const threshold = parseInt(args[1]);
    const window    = parseInt(args[2]) || 5;
    if (isNaN(threshold) || threshold < 2) return message.reply(err('Provide a valid threshold (minimum 2).'));
    setAutomodConfig(guildId, { spam_threshold: threshold, spam_window: window * 1000 });
    return message.reply(ok(`Spam detection: **${threshold}** messages per **${window}s**.`));
  }

  if (sub === 'caps') {
    const pct = parseInt(args[1]);
    if (isNaN(pct) || pct < 10 || pct > 100) return message.reply(err('Provide a percentage between 10 and 100.'));
    setAutomodConfig(guildId, { caps_threshold: pct });
    return message.reply(ok(`Caps threshold set to **${pct}%**.`));
  }

  if (sub === 'links') {
    const mode = args[1]?.toLowerCase();
    if (!['off', 'block'].includes(mode)) return message.reply(err('Mode must be `off` or `block`.'));
    setAutomodConfig(guildId, { link_mode: mode });
    return message.reply(ok(`Link mode set to **${mode}**.`));
  }

  if (sub === 'mentions') {
    const limit = parseInt(args[1]);
    if (isNaN(limit) || limit < 1) return message.reply(err('Provide a valid mention limit.'));
    setAutomodConfig(guildId, { mention_limit: limit });
    return message.reply(ok(`Mention limit set to **${limit}**.`));
  }

  if (sub === 'addword') {
    const word = args[1]?.toLowerCase();
    if (!word) return message.reply(err('Provide a word to add.'));
    const cfg   = getAutomodConfig(guildId);
    const words = JSON.parse(cfg?.bad_words || '[]');
    if (!words.includes(word)) words.push(word);
    setAutomodConfig(guildId, { bad_words: JSON.stringify(words) });
    return message.reply(ok(`Added \`${word}\` to the blocked words list.`));
  }

  if (sub === 'removeword') {
    const word = args[1]?.toLowerCase();
    if (!word) return message.reply(err('Provide a word to remove.'));
    const cfg   = getAutomodConfig(guildId);
    const words = JSON.parse(cfg?.bad_words || '[]').filter(w => w !== word);
    setAutomodConfig(guildId, { bad_words: JSON.stringify(words) });
    return message.reply(ok(`Removed \`${word}\` from the blocked words list.`));
  }

  return message.reply(card({
    title: 'AutoMod — Usage',
    desc: [
      '`.automod enable/disable` — toggle AutoMod',
      '`.automod log #channel` — set the log channel',
      '`.automod spam <threshold> [window_seconds]` — configure spam detection',
      '`.automod caps <percent>` — set the caps percentage threshold',
      '`.automod links <off|block>` — configure link filtering',
      '`.automod mentions <limit>` — set the mention limit',
      '`.automod addword <word>` — add a blocked word',
      '`.automod removeword <word>` — remove a blocked word',
    ].join('\n'),
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('automod')
  .setDescription('configure the auto-moderation system')
  .addSubcommand(s => s.setName('enable').setDescription('enable auto-moderation'))
  .addSubcommand(s => s.setName('disable').setDescription('disable auto-moderation'))
  .addSubcommand(s => s
    .setName('addword')
    .setDescription('add a word to the banned words list')
    .addStringOption(o => o.setName('word').setDescription('word to ban').setRequired(true)))
  .addSubcommand(s => s
    .setName('removeword')
    .setDescription('remove a word from the banned words list')
    .addStringOption(o => o.setName('word').setDescription('word to remove').setRequired(true)))
  .addSubcommand(s => s.setName('status').setDescription('show current auto-mod settings'))
  .addSubcommand(s => s
    .setName('antispam')
    .setDescription('configure anti-spam threshold')
    .addIntegerOption(o => o.setName('messages').setDescription('messages per 5 seconds before action').setRequired(true).setMinValue(1)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub  = interaction.options.getSubcommand();
  const word = interaction.options.getString('word');
  const msgs = interaction.options.getInteger('messages');
  const args = [sub, word ?? msgs ?? ''].filter(x => x !== '' && x != null);
  return prefixExecute(interaction, args);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
