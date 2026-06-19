'use strict';

const { getGuild, ensureGuild, db } = require('../utils/database');
const { ok, err, card, COLORS }      = require('../utils/components');
const { PermissionFlagsBits }         = require('discord.js');

const category   = 'welcome';
const prefixName = 'welcome';
const aliases    = ['welcomeset'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
    return message.reply(err('You need the **Manage Server** permission.'));

  const guildId = message.guild.id;
  ensureGuild(guildId);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === 'status') {
    const g = getGuild(guildId);
    return message.reply(card({
      title: 'Welcome Configuration',
      desc: [
        `**Status** ${g.welcome_enabled ? '✅ Enabled' : '❌ Disabled'}`,
        `**Channel** ${g.welcome_channel ? `<#${g.welcome_channel}>` : 'Not set'}`,
        `**Message** ${g.welcome_message || 'Default'}`,
        `**DM** ${g.welcome_dm ? '✅ Enabled' : '❌ Disabled'}`,
        `**DM Message** ${g.welcome_dm_message || 'Default'}`,
        `**Auto-roles** ${JSON.parse(g.welcome_roles || '[]').map(r => `<@&${r}>`).join(' ') || 'None'}`,
      ].join('\n'),
      color: COLORS.green,
      footer: 'Variables: {user}, {username}, {server}, {membercount}',
    }));
  }

  if (sub === 'enable') {
    db.prepare('UPDATE guilds SET welcome_enabled = 1 WHERE guild_id = ?').run(guildId);
    return message.reply(ok('Welcome messages have been **enabled**.'));
  }

  if (sub === 'disable') {
    db.prepare('UPDATE guilds SET welcome_enabled = 0 WHERE guild_id = ?').run(guildId);
    return message.reply(ok('Welcome messages have been **disabled**.'));
  }

  if (sub === 'channel') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply(err('Mention a channel.'));
    db.prepare('UPDATE guilds SET welcome_channel = ? WHERE guild_id = ?').run(ch.id, guildId);
    return message.reply(ok(`Welcome channel set to ${ch}.`));
  }

  if (sub === 'message') {
    const msg = args.slice(1).join(' ');
    if (!msg) return message.reply(err('Provide a welcome message. Variables: `{user}`, `{username}`, `{server}`, `{membercount}`'));
    db.prepare('UPDATE guilds SET welcome_message = ? WHERE guild_id = ?').run(msg, guildId);
    return message.reply(ok(`Welcome message updated.`));
  }

  if (sub === 'dm') {
    const toggle = args[1]?.toLowerCase();
    if (toggle === 'on' || toggle === 'enable') {
      db.prepare('UPDATE guilds SET welcome_dm = 1 WHERE guild_id = ?').run(guildId);
      return message.reply(ok('Welcome DM has been **enabled**.'));
    }
    if (toggle === 'off' || toggle === 'disable') {
      db.prepare('UPDATE guilds SET welcome_dm = 0 WHERE guild_id = ?').run(guildId);
      return message.reply(ok('Welcome DM has been **disabled**.'));
    }
    const dmMsg = args.slice(1).join(' ');
    if (dmMsg) {
      db.prepare('UPDATE guilds SET welcome_dm_message = ? WHERE guild_id = ?').run(dmMsg, guildId);
      return message.reply(ok('Welcome DM message updated.'));
    }
    return message.reply(err('Usage: `.welcome dm on/off` or `.welcome dm <message>`'));
  }

  if (sub === 'addrole') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('Mention a role.'));
    const g     = getGuild(guildId);
    const roles = JSON.parse(g.welcome_roles || '[]');
    if (!roles.includes(role.id)) roles.push(role.id);
    db.prepare('UPDATE guilds SET welcome_roles = ? WHERE guild_id = ?').run(JSON.stringify(roles), guildId);
    return message.reply(ok(`${role} will be given to new members.`));
  }

  if (sub === 'removerole') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('Mention a role.'));
    const g     = getGuild(guildId);
    const roles = JSON.parse(g.welcome_roles || '[]').filter(r => r !== role.id);
    db.prepare('UPDATE guilds SET welcome_roles = ? WHERE guild_id = ?').run(JSON.stringify(roles), guildId);
    return message.reply(ok(`${role} removed from auto-roles.`));
  }

  return message.reply(card({
    title: 'Welcome — Usage',
    desc: [
      '`.welcome status` — view configuration',
      '`.welcome enable/disable` — toggle welcome messages',
      '`.welcome channel #channel` — set the welcome channel',
      '`.welcome message <text>` — set the welcome message',
      '`.welcome dm on/off` — toggle welcome DMs',
      '`.welcome dm <message>` — set the DM message',
      '`.welcome addrole @role` — add an auto-role',
      '`.welcome removerole @role` — remove an auto-role',
    ].join('\n'),
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('configure the welcome message system')
  .addSubcommand(s => s
    .setName('setup')
    .setDescription('set the welcome channel and message')
    .addChannelOption(o => o.setName('channel').setDescription('welcome channel').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('welcome message — use {user} and {server}').setRequired(true)))
  .addSubcommand(s => s.setName('enable').setDescription('enable the welcome system'))
  .addSubcommand(s => s.setName('disable').setDescription('disable the welcome system'))
  .addSubcommand(s => s.setName('test').setDescription('send a test welcome message'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub     = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  if (sub === 'setup') {
    const ch  = interaction.options.getChannel('channel');
    const msg = interaction.options.getString('message');
    db.prepare('UPDATE guilds SET welcome_channel = ?, welcome_message = ?, welcome_enabled = 1 WHERE id = ?').run(ch.id, msg, guildId);
    return interaction.reply(ok(`Welcome system configured — messages will go to ${ch}.`));
  }
  if (sub === 'enable') {
    db.prepare('UPDATE guilds SET welcome_enabled = 1 WHERE id = ?').run(guildId);
    return interaction.reply(ok('Welcome system enabled.'));
  }
  if (sub === 'disable') {
    db.prepare('UPDATE guilds SET welcome_enabled = 0 WHERE id = ?').run(guildId);
    return interaction.reply(ok('Welcome system disabled.'));
  }
  if (sub === 'test') {
    const g = getGuild(guildId);
    const ch = g.welcome_channel ? interaction.guild.channels.cache.get(g.welcome_channel) : interaction.channel;
    const msg = (g.welcome_message || 'Welcome {user} to {server}!')
      .replace('{user}', interaction.user.toString())
      .replace('{server}', interaction.guild.name);
    await ch.send(msg);
    return interaction.reply(ok('Test welcome message sent.'));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
