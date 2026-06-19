'use strict';

const {
  getTicketConfig, setTicketConfig, closeTicket, getOpenTicket,
} = require('../utils/database');
const { ok, err, card, COLORS } = require('../utils/components');
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

const category   = 'tickets';
const prefixName = 'setupticket';
const aliases    = ['ticket', 'tickets'];

const TAG_TICKET_CATEGORY    = '1513739601238429716';
const VERIFY_TICKET_CATEGORY = '1514108054965063761';
const ACCENT = 0x000000;

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();

  if (!sub || sub === 'status') {
    const cfg = getTicketConfig(guildId);
    return message.reply(card({
      title: 'Ticket Configuration',
      desc: cfg ? [
        `**Category** ${cfg.category_id ? `<#${cfg.category_id}>` : 'None'}`,
        `**Staff Role** ${cfg.staff_role ? `<@&${cfg.staff_role}>` : 'None'}`,
        `**VMR Role** ${cfg.vmr_role ? `<@&${cfg.vmr_role}>` : 'None'}`,
        `**Log Channel** ${cfg.log_channel ? `<#${cfg.log_channel}>` : 'None'}`,
        `**Open Message** ${cfg.open_message || 'Default'}`,
      ].join('\n') : 'Not configured yet.',
      color: ACCENT,
    }));
  }

  // .setupticket panel [#channel] — general support panel
  if (sub === 'panel') {
    const ch = message.mentions.channels.first() || message.channel;
    const c  = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Support Tickets\nClick the button below to open a support ticket.`
      ));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary)
    );
    await ch.send({ flags: MessageFlags.IsComponentsV2, components: [c, row] });
    return message.reply(ok(`Ticket panel sent to ${ch}.`));
  }

  // .setupticket tag [#channel] — tag request panel
  if (sub === 'tag') {
    const ch = message.mentions.channels.first() || message.channel;
    const c  = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Tag Request\n\nClick the button below to open a tag request ticket.\n\nStaff will assist you with obtaining a Roblox group tag.`
      ));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_tag')
        .setLabel('Open Tag Request')
        .setStyle(ButtonStyle.Primary)
    );
    await ch.send({ flags: MessageFlags.IsComponentsV2, components: [c, row] });
    return message.reply(ok(`Tag request panel sent to ${ch}.`));
  }

  // .setupticket verify [#channel] — verification panel
  if (sub === 'verify') {
    const ch = message.mentions.channels.first() || message.channel;
    const c  = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Verification\n\nClick the button below to open a verification ticket.\n\nEnter your Roblox username to begin.`
      ));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_verify')
        .setLabel('Open Verification Ticket')
        .setStyle(ButtonStyle.Primary)
    );
    await ch.send({ flags: MessageFlags.IsComponentsV2, components: [c, row] });
    return message.reply(ok(`Verification panel sent to ${ch}.`));
  }

  if (sub === 'staffrole') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('Mention a role.\nUsage: `.setupticket staffrole @role`'));
    setTicketConfig(guildId, { staff_role: role.id });
    return message.reply(ok(`Staff role set to ${role}. This role can use Verify, Kick, and Close buttons.`));
  }

  if (sub === 'vmr') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('Mention a role.\nUsage: `.setupticket vmr @role`'));
    setTicketConfig(guildId, { vmr_role: role.id });
    return message.reply(ok(`VMR (Verification Manager) role set to ${role}. This role can see verification tickets and use the Accept into Group and Verify buttons.`));
  }

  if (sub === 'category') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply(err('Mention a category channel.'));
    setTicketConfig(guildId, { category_id: ch.id });
    return message.reply(ok(`Ticket category set to ${ch}.`));
  }

  if (sub === 'log') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply(err('Mention a channel.'));
    setTicketConfig(guildId, { log_channel: ch.id });
    return message.reply(ok(`Ticket log channel set to ${ch}.`));
  }

  if (sub === 'message') {
    const msg = args.slice(1).join(' ');
    if (!msg) return message.reply(err('Provide an opening message.'));
    setTicketConfig(guildId, { open_message: msg });
    return message.reply(ok('Ticket opening message updated.'));
  }

  return message.reply(card({
    title: 'Setup Ticket — Usage',
    desc: [
      '`.setupticket status` — view configuration',
      '`.setupticket panel [#channel]` — send general support panel',
      '`.setupticket tag [#channel]` — send tag request panel',
      '`.setupticket verify [#channel]` — send verification panel',
      '`.setupticket staffrole @role` — set role that can use staff buttons',
      '`.setupticket vmr @role` — set the Verification Manager role (sees verify tickets, has Accept + Verify buttons)',
      '`.setupticket category #channel` — set default ticket category',
      '`.setupticket log #channel` — set the log channel',
      '`.setupticket message <text>` — set the ticket opening message',
    ].join('\n'),
    color: ACCENT,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('setupticket')
  .setDescription('configure the ticket system')
  .addSubcommand(s => s.setName('status').setDescription('view ticket configuration'))
  .addSubcommand(s => s
    .setName('staffrole')
    .setDescription('set the role that can use staff ticket buttons')
    .addRoleOption(o => o.setName('role').setDescription('staff role').setRequired(true)))
  .addSubcommand(s => s
    .setName('panel')
    .setDescription('send a ticket panel')
    .addStringOption(o => o.setName('type').setDescription('panel type').setRequired(false)
      .addChoices(
        { name: 'support', value: 'support' },
        { name: 'tag',     value: 'tag' },
        { name: 'verify',  value: 'verify' },
      ))
    .addChannelOption(o => o.setName('channel').setDescription('channel for the panel')))
  .addSubcommand(s => s
    .setName('category')
    .setDescription('set default ticket category')
    .addChannelOption(o => o.setName('category').setDescription('category channel').setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub  = interaction.options.getSubcommand();
  const fakeMsg = {
    guild:   interaction.guild,
    member:  interaction.member,
    author:  interaction.user,
    channel: interaction.channel,
    mentions: {
      channels: { first: () => interaction.options.getChannel?.('channel') || interaction.options.getChannel?.('category') || null },
      roles:    { first: () => interaction.options.getRole?.('role') || null },
    },
    reply: (p) => interaction.replied || interaction.deferred
      ? interaction.editReply(p)
      : interaction.reply(p),
  };

  if (sub === 'staffrole') return prefixExecute(fakeMsg, ['staffrole']);
  if (sub === 'status')    return prefixExecute(fakeMsg, ['status']);
  if (sub === 'category')  return prefixExecute(fakeMsg, ['category']);
  if (sub === 'panel') {
    const type = interaction.options.getString('type') || 'support';
    return prefixExecute(fakeMsg, [type]);
  }
  return interaction.reply(err('Use `.setupticket` for full configuration options.'));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
