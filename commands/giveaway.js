'use strict';

const {
  createGiveaway, getGiveaway, updateGiveaway, getActiveGiveaways,
} = require('../utils/database');
const { endGiveaway }                       = require('../handlers/giveawayHandler');
const { ok, err, card, COLORS, CV2 }        = require('../utils/components');
const { parseDuration }                      = require('../utils/time');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { randomUUID } = require('crypto');

const category   = 'giveaway';
const prefixName = 'giveaway';
const aliases    = ['gw', 'give'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission to manage giveaways.'));

  const sub = args[0]?.toLowerCase();

  // ── .giveaway start <duration> <winners> <prize> ─────────────────────────
  if (sub === 'start' || sub === 'create') {
    const durationStr = args[1];
    const winners     = parseInt(args[2]) || 1;
    const prize       = args.slice(3).join(' ');

    if (!durationStr || !prize)
      return message.reply(err('Usage: `.giveaway start <duration> <winners> <prize>`\nExample: `.giveaway start 1h 1 Nitro`'));

    const ms = parseDuration(durationStr);
    if (!ms) return message.reply(err('Invalid duration. Examples: `30m`, `2h`, `1d`'));

    const id     = randomUUID();
    const endsAt = Math.floor((Date.now() + ms) / 1000);

    createGiveaway({
      id, guildId: message.guild.id,
      channelId: message.channel.id,
      prize, winners,
      hostId: message.author.id,
      endsAt,
    });

    const c = new ContainerBuilder()
      .setAccentColor(COLORS.gold)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎉 Giveaway — ${prize}`))
      .addSeparatorComponents(S())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `**Prize** ${prize}`,
        `**Winners** ${winners}`,
        `**Hosted by** ${message.author}`,
        `**Ends** <t:${endsAt}:R> (<t:${endsAt}:f>)`,
      ].join('\n')));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${id}`)
        .setLabel('Enter Giveaway')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉')
    );

    const gMsg = await message.channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [c, row],
    });

    updateGiveaway(id, { message_id: gMsg.id });
    return message.reply(ok(`Giveaway started! It will end <t:${endsAt}:R>.`));
  }

  // ── .giveaway end <message_id> ────────────────────────────────────────────
  if (sub === 'end') {
    const msgId = args[1];
    if (!msgId) return message.reply(err('Provide the giveaway message ID.'));
    const gw = getGiveaway(msgId);
    if (!gw || gw.guild_id !== message.guild.id) return message.reply(err('Giveaway not found in this server.'));
    if (gw.status !== 'active') return message.reply(err('That giveaway has already ended.'));
    await endGiveaway(message.client, gw);
    return message.reply(ok('Giveaway ended.'));
  }

  // ── .giveaway list ────────────────────────────────────────────────────────
  if (!sub || sub === 'list') {
    const active = getActiveGiveaways().filter(g => g.guild_id === message.guild.id);
    if (!active.length) return message.reply(card({ title: 'Giveaways', desc: 'No active giveaways.', color: COLORS.gold }));
    return message.reply(card({
      title: `Active Giveaways — ${active.length}`,
      desc:  active.map(g => `**${g.prize}** — ends <t:${g.ends_at}:R> — ${g.winners} winner(s)`).join('\n'),
      color: COLORS.gold,
    }));
  }

  return message.reply(card({
    title: 'Giveaway — Usage',
    desc: [
      '`.giveaway start <duration> <winners> <prize>` — start a giveaway',
      '`.giveaway end <message_id>` — end a giveaway early',
      '`.giveaway list` — view active giveaways',
    ].join('\n'),
    color: COLORS.gold,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('manage giveaways')
  .addSubcommand(s => s
    .setName('start')
    .setDescription('start a giveaway')
    .addStringOption(o => o.setName('prize').setDescription('what is being given away').setRequired(true))
    .addIntegerOption(o => o.setName('duration').setDescription('duration in minutes').setRequired(true).setMinValue(1))
    .addIntegerOption(o => o.setName('winners').setDescription('number of winners').setMinValue(1)))
  .addSubcommand(s => s
    .setName('end')
    .setDescription('end a giveaway early by message ID')
    .addStringOption(o => o.setName('messageid').setDescription('giveaway message ID').setRequired(true)))
  .addSubcommand(s => s
    .setName('reroll')
    .setDescription('reroll a giveaway winner')
    .addStringOption(o => o.setName('messageid').setDescription('giveaway message ID').setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub       = interaction.options.getSubcommand();
  const prize     = interaction.options.getString('prize');
  const duration  = interaction.options.getInteger('duration');
  const winners   = interaction.options.getInteger('winners') || 1;
  const messageId = interaction.options.getString('messageid');
  const args      = [sub, prize, duration && `${duration}m`, winners, messageId].filter(Boolean);
  return prefixExecute(interaction, args);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
