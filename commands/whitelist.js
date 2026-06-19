'use strict';

const {
  addWhitelistUser, removeWhitelistUser,
  addWhitelistRole, removeWhitelistRole,
  getWhitelistUsers, getWhitelistRoles,
} = require('../utils/database');
const { ok, err, card, COLORS, CV2, C } = require('../utils/components');
const { CATEGORIES, OWNER_IDS }          = require('../utils/constants');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

const category = 'all';
const prefixName = 'wl';
const aliases    = ['whitelist'];

/**
 * Parses a category string that may contain multiple categories
 * separated by "/" or ",". Returns an array of validated category names.
 */
function parseCategories(input) {
  const parts = input.split(/[\/,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const valid = [];
  const invalid = [];
  for (const p of parts) {
    if (CATEGORIES.includes(p)) valid.push(p);
    else invalid.push(p);
  }
  return { valid, invalid };
}

async function prefixExecute(message, args) {
  const canManageWl = OWNER_IDS.includes(message.author.id)
    || message.author.id === message.guild.ownerId
    || (message.member && (
         require('../utils/whitelist').isWhitelisted(message.member, 'all')
       ));
  if (!canManageWl) {
    return message.reply(err('Only the bot owner, server owner, or a fully whitelisted user may manage the whitelist.'));
  }

  const guildId = message.guild.id;
  const sub     = args[0]?.toLowerCase();

  // ── .wl list ────────────────────────────────────────────────────────────
  if (!sub || sub === 'list') {
    const users = getWhitelistUsers(guildId);
    const roles = getWhitelistRoles(guildId);

    const c = new ContainerBuilder()
      .setAccentColor(COLORS.blue)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Whitelist'));

    if (users.length) {
      c.addSeparatorComponents(S())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          '**Users**\n' + users.map(u => `<@${u.user_id}> — \`${u.category}\``).join('\n')
        ));
    }

    if (roles.length) {
      c.addSeparatorComponents(S())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          '**Roles**\n' + roles.map(r => `<@&${r.role_id}> — \`${r.category}\``).join('\n')
        ));
    }

    if (!users.length && !roles.length) {
      c.addSeparatorComponents(S())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# No whitelist entries yet.'));
    }

    return message.reply({ flags: require('discord.js').MessageFlags.IsComponentsV2, components: [c] });
  }

  // ── .wl add @user [category] ────────────────────────────────────────────
  if (sub === 'add') {
    const target = message.mentions.users.first();
    if (!target) return message.reply(err('Mention a user to whitelist.'));
    const catStr = args[2] || 'all';
    const { valid, invalid } = parseCategories(catStr);
    if (!valid.length) return message.reply(err(`Invalid categor${invalid.length === 1 ? 'y' : 'ies'}: \`${invalid.join(', ')}\`\nValid: ${CATEGORIES.join(', ')}`));
    for (const cat of valid) addWhitelistUser(guildId, target.id, cat);
    return message.reply(ok(`${target} has been whitelisted for: **${valid.join(', ')}**.`));
  }

  // ── .wl remove @user [category] ─────────────────────────────────────────
  if (sub === 'remove') {
    const target = message.mentions.users.first();
    if (!target) return message.reply(err('Mention a user to remove from the whitelist.'));
    const catStr = args[2] || 'all';
    const { valid, invalid } = parseCategories(catStr);
    if (!valid.length) return message.reply(err(`Invalid categor${invalid.length === 1 ? 'y' : 'ies'}: \`${invalid.join(', ')}\``));
    for (const cat of valid) removeWhitelistUser(guildId, target.id, cat);
    return message.reply(ok(`${target} has been removed from the whitelist for: **${valid.join(', ')}**.`));
  }

  // ── .wl role @role {category/categories} ────────────────────────────────
  if (sub === 'role') {
    const roleMention = message.mentions.roles.first();
    if (!roleMention) return message.reply(err('Mention a role to whitelist.'));
    const catStr = args[2] || 'all';
    const { valid, invalid } = parseCategories(catStr);
    if (!valid.length) return message.reply(err(`Invalid categor${invalid.length === 1 ? 'y' : 'ies'}: \`${invalid.join(', ')}\`\nValid: ${CATEGORIES.join(', ')}`));
    for (const cat of valid) addWhitelistRole(guildId, roleMention.id, cat);
    return message.reply(ok(`${roleMention} has been whitelisted for: **${valid.join(', ')}**.`));
  }

  // ── .wl unrole @role [category] ─────────────────────────────────────────
  if (sub === 'unrole') {
    const roleMention = message.mentions.roles.first();
    if (!roleMention) return message.reply(err('Mention a role to remove from the whitelist.'));
    const catStr = args[2] || 'all';
    const { valid, invalid } = parseCategories(catStr);
    if (!valid.length) return message.reply(err(`Invalid categor${invalid.length === 1 ? 'y' : 'ies'}: \`${invalid.join(', ')}\``));
    for (const cat of valid) removeWhitelistRole(guildId, roleMention.id, cat);
    return message.reply(ok(`${roleMention} has been removed from the whitelist for: **${valid.join(', ')}**.`));
  }

  // ── .wl categories ──────────────────────────────────────────────────────
  if (sub === 'categories') {
    return message.reply(card({
      title: 'Available Categories',
      desc:  CATEGORIES.map(c => `\`${c}\``).join(', '),
      color: COLORS.blue,
      footer: 'Separate multiple categories with "/" e.g. moderation/server/roblox',
    }));
  }

  return message.reply(card({
    title: 'Whitelist — Usage',
    desc: [
      '`.wl list` — show all whitelisted users and roles',
      '`.wl add @user [category]` — whitelist a user',
      '`.wl remove @user [category]` — remove a user',
      '`.wl role @role {category/categories}` — whitelist a role for one or more categories',
      '`.wl unrole @role [category]` — remove a role from the whitelist',
      '`.wl categories` — list all valid categories',
    ].join('\n'),
    color: COLORS.blue,
  }));
}

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('wl')
  .setDescription('manage the bot whitelist — control who can use restricted commands')
  .addSubcommand(s => s
    .setName('adduser')
    .setDescription('whitelist a user for a command category')
    .addUserOption(o => o.setName('user').setDescription('user to whitelist').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('command category (leave blank for all)').setRequired(false)))
  .addSubcommand(s => s
    .setName('removeuser')
    .setDescription('remove a user from the whitelist')
    .addUserOption(o => o.setName('user').setDescription('user to remove').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('category (blank = all)').setRequired(false)))
  .addSubcommand(s => s
    .setName('addrole')
    .setDescription('whitelist a role for a command category')
    .addRoleOption(o => o.setName('role').setDescription('role to whitelist').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('command category').setRequired(false)))
  .addSubcommand(s => s
    .setName('removerole')
    .setDescription('remove a role from the whitelist')
    .addRoleOption(o => o.setName('role').setDescription('role to remove').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('category').setRequired(false)))
  .addSubcommand(s => s.setName('list').setDescription('show all whitelisted users and roles'))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  const sub  = interaction.options.getSubcommand();
  const user = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  const cat  = interaction.options.getString('category') || 'all';
  const args = [sub, user?.id ?? role?.id, cat].filter(Boolean);
  return prefixExecute(interaction, args);
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
