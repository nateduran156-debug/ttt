'use strict';

const { ok, err, card, COLORS } = require('../utils/components');
const { getTagManagers, addTagManager, removeTagManager } = require('../utils/database');
const { isWhitelisted } = require('../utils/whitelist');
const { OWNER_IDS } = require('../utils/constants');
const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  PermissionFlagsBits,
} = require('discord.js');

const category   = 'tags';
const prefixName = 'wltagmanager';
const aliases    = ['wltag', 'tagwl'];

// Must match the list in commands/tag.js
const HARDCODED_TAG_ADMINS = ['1351339266978086963'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

function canManageTagWl(ctx) {
  const userId = ctx.author?.id ?? ctx.user?.id;
  if (HARDCODED_TAG_ADMINS.includes(userId)) return true;
  if (OWNER_IDS.includes(userId)) return true;
  if (isWhitelisted(ctx.member, 'all')) return true;
  if (isWhitelisted(ctx.member, 'tags')) return true;
  const { getTagManagers } = require('../utils/database');
  const wl = getTagManagers(ctx.guild?.id ?? ctx.member.guild.id);
  if (wl.users.includes(userId)) return true;
  for (const roleId of ctx.member.roles.cache.keys()) {
    if (wl.roles.includes(roleId)) return true;
  }
  return false;
}

async function prefixExecute(message, args) {
  if (!canManageTagWl(message)) {
    return message.reply(err('You need **Manage Server** to manage tag whitelist.'));
  }

  const sub = args[0]?.toLowerCase();

  if (!sub || sub === 'list') {
    const wl = getTagManagers(message.guild.id);
    const userLines  = wl.users.length  ? wl.users.map(id => `<@${id}>`).join(', ')    : 'None';
    const roleLines  = wl.roles.length  ? wl.roles.map(id => `<@&${id}>`).join(', ')   : 'None';

    const c = new ContainerBuilder().setAccentColor(0x000000)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Tag Manager Whitelist'))
      .addSeparatorComponents(S())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Users**\n${userLines}\n\n**Roles**\n${roleLines}`
      ));
    return message.reply({ flags: require('discord.js').MessageFlags.IsComponentsV2, components: [c] });
  }

  if (sub === 'add') {
    const mentionedUser = message.mentions.users.first();
    const mentionedRole = message.mentions.roles.first();
    if (!mentionedUser && !mentionedRole) {
      return message.reply(err('Mention a user or role to whitelist.\nUsage: `.wltagmanager add @user` or `.wltagmanager add @role`'));
    }
    if (mentionedUser) {
      addTagManager(message.guild.id, 'user', mentionedUser.id);
      return message.reply(ok(`${mentionedUser} added to tag manager whitelist.`));
    }
    addTagManager(message.guild.id, 'role', mentionedRole.id);
    return message.reply(ok(`${mentionedRole} added to tag manager whitelist.`));
  }

  if (sub === 'remove') {
    const mentionedUser = message.mentions.users.first();
    const mentionedRole = message.mentions.roles.first();
    if (!mentionedUser && !mentionedRole) {
      return message.reply(err('Mention a user or role to remove.'));
    }
    if (mentionedUser) {
      removeTagManager(message.guild.id, 'user', mentionedUser.id);
      return message.reply(ok(`${mentionedUser} removed from tag manager whitelist.`));
    }
    removeTagManager(message.guild.id, 'role', mentionedRole.id);
    return message.reply(ok(`${mentionedRole} removed from tag manager whitelist.`));
  }

  return message.reply(card({
    title: 'wltagmanager — Usage',
    desc: [
      '`.wltagmanager list` — view whitelist',
      '`.wltagmanager add @user` — whitelist a user',
      '`.wltagmanager add @role` — whitelist a role',
      '`.wltagmanager remove @user/@role` — remove from whitelist',
    ].join('\n'),
    color: 0x000000,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('wltagmanager')
  .setDescription('manage who can use the tag command')
  .addSubcommand(s => s.setName('list').setDescription('view tag manager whitelist'))
  .addSubcommand(s => s
    .setName('add')
    .setDescription('add a user or role to the tag manager whitelist')
    .addUserOption(o => o.setName('user').setDescription('user to whitelist'))
    .addRoleOption(o => o.setName('role').setDescription('role to whitelist')))
  .addSubcommand(s => s
    .setName('remove')
    .setDescription('remove a user or role from the whitelist')
    .addUserOption(o => o.setName('user').setDescription('user to remove'))
    .addRoleOption(o => o.setName('role').setDescription('role to remove')))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const sub  = interaction.options.getSubcommand();
  const user = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  const fakeMessage = {
    guild:   interaction.guild,
    member:  interaction.member,
    author:  interaction.user,
    mentions: {
      users: { first: () => user },
      roles: { first: () => role },
    },
    reply: (payload) => interaction.reply({ ...payload, ephemeral: false }),
  };
  return prefixExecute(fakeMessage, [sub]);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
