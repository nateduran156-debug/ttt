'use strict';

const {
  SlashCommandBuilder, PermissionFlagsBits,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const { getWhitelistRoles, addWhitelistRole, removeWhitelistRole, clearWhitelistRoles } = require('../../utils/database');
const { ok, err, COLORS } = require('../../utils/components');

const CV2 = MessageFlags.IsComponentsV2;
const S   = (size = SeparatorSpacingSize.Small, div = true) =>
  new SeparatorBuilder().setSpacing(size).setDivider(div);

const data = new SlashCommandBuilder()
  .setName('wlroles')
  .setDescription('manage which roles can use this bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(s => s
    .setName('add')
    .setDescription('allow a role to use the bot')
    .addRoleOption(o => o.setName('role').setDescription('role to whitelist').setRequired(true))
  )
  .addSubcommand(s => s
    .setName('remove')
    .setDescription('remove a role from the whitelist')
    .addRoleOption(o => o.setName('role').setDescription('role to remove').setRequired(true))
  )
  .addSubcommand(s => s.setName('list').setDescription('show all whitelisted roles'))
  .addSubcommand(s => s.setName('clear').setDescription('clear whitelist — allow everyone to use the bot'));

const category   = 'misc';
const prefixName = 'wlroles';
const aliases    = ['wladd'];

async function listPage(guild) {
  const roles = getWhitelistRoles(guild.id);
  const body  = !roles.length
    ? '-# No whitelist — everyone can use the bot'
    : roles.map(r => {
        const role = guild.roles.cache.get(r);
        return role ? `${role} \`${r}\`` : `Unknown role \`${r}\``;
      }).join('\n');

  const c = new ContainerBuilder()
    .setAccentColor(COLORS.blue)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `## Whitelisted Roles\n-# only these roles can use bot commands`
    ))
    .addSeparatorComponents(S())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
  return { flags: CV2, components: [c] };
}

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'add') {
    const role = interaction.options.getRole('role');
    addWhitelistRole(interaction.guild.id, role.id);
    return interaction.reply(ok(`${role} added to the whitelist`));
  }
  if (sub === 'remove') {
    const role = interaction.options.getRole('role');
    removeWhitelistRole(interaction.guild.id, role.id);
    return interaction.reply(ok(`${role} removed from the whitelist`));
  }
  if (sub === 'list')  return interaction.reply(await listPage(interaction.guild));
  if (sub === 'clear') {
    clearWhitelistRoles(interaction.guild.id);
    return interaction.reply(ok('whitelist cleared — everyone can use the bot'));
  }
}

async function prefixExecute(message, args) {
  if (!message.member?.permissions?.has('Administrator'))
    return message.reply(err('only admins can manage the whitelist'));

  const sub = args[0]?.toLowerCase();

  if (sub === 'add' || sub === 'wladd') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('mention a role to whitelist'));
    addWhitelistRole(message.guild.id, role.id);
    return message.reply(ok(`${role} added to the whitelist`));
  }
  if (sub === 'remove') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply(err('mention a role to remove'));
    removeWhitelistRole(message.guild.id, role.id);
    return message.reply(ok(`${role} removed from the whitelist`));
  }
  if (sub === 'list')  return message.reply(await listPage(message.guild));
  if (sub === 'clear') {
    clearWhitelistRoles(message.guild.id);
    return message.reply(ok('whitelist cleared — everyone can use the bot'));
  }

  return message.reply(await listPage(message.guild));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
