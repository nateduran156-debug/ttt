const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuild, getGuild } = require('../utils/database');
const C = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or update server configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View the current server configuration')
    )
    .addSubcommand(sub =>
      sub.setName('verifiedrole')
        .setDescription('Set the role given to users after verification')
        .addRoleOption(opt => opt.setName('role').setDescription('Verified role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('logchannel')
        .setDescription('Set the general log channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('modchannel')
        .setDescription('Set the moderation log channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Mod log channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('muterole')
        .setDescription('Set the mute/timeout role')
        .addRoleOption(opt => opt.setName('role').setDescription('Mute role').setRequired(true))
    ),

  prefix: { name: 'config', aliases: ['cfg'] },
  usage: 'config <view|verifiedrole|logchannel|modchannel|muterole> [value]',

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await runConfig(sub, interaction.guild, {
      role:    interaction.options.getRole('role'),
      channel: interaction.options.getChannel('channel'),
    }, (payload) => interaction.reply(payload));
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has('Administrator') && message.author.id !== require('../utils/constants').OWNER_ID) {
      return C.prefixErr(message, 'You need Administrator permission to use this command.');
    }
    const sub = (args[0] ?? '').toLowerCase();
    if (!sub) {
      return message.reply(C.commandCard({
        name: 'config',
        description: 'View or update server configuration.',
        syntax: `.config <view|verifiedrole|logchannel|modchannel|muterole> [value]`,
        example: `.config verifiedrole @Verified`,
        aliases: ['cfg'],
      }));
    }

    const mentionId = (args[1] ?? '').replace(/[<@!&#>]/g, '');
    const role    = mentionId ? message.guild.roles.cache.get(mentionId) : null;
    const channel = mentionId ? message.guild.channels.cache.get(mentionId) : null;

    await runConfig(sub, message.guild, { role, channel },
      (payload) => C.prefixSend(message, payload.components)
    );
  }
};

async function runConfig(sub, guild, opts, reply) {
  const guildId = guild.id;

  if (sub === 'view') {
    const cfg = getGuild(guildId);
    return reply(C.card({
      title: 'Server Configuration',
      fields: [
        { name: 'Verified Role',    value: cfg.verified_role_id ? `<@&${cfg.verified_role_id}>` : 'Not set' },
        { name: 'Log Channel',      value: cfg.log_channel_id   ? `<#${cfg.log_channel_id}>`   : 'Not set' },
        { name: 'Mod Log Channel',  value: cfg.mod_channel_id   ? `<#${cfg.mod_channel_id}>`   : 'Not set' },
        { name: 'Mute Role',        value: cfg.mute_role_id     ? `<@&${cfg.mute_role_id}>`    : 'Not set' },
      ],
      color: C.COLORS.info,
    }));
  }

  if (sub === 'verifiedrole') {
    if (!opts.role) return reply(C.err('Mention a role.'));
    setGuild(guildId, 'verified_role_id', opts.role.id);
    return reply(C.ok(`Verified role set to <@&${opts.role.id}>.`));
  }

  if (sub === 'logchannel') {
    if (!opts.channel) return reply(C.err('Mention a channel.'));
    setGuild(guildId, 'log_channel_id', opts.channel.id);
    return reply(C.ok(`Log channel set to <#${opts.channel.id}>.`));
  }

  if (sub === 'modchannel') {
    if (!opts.channel) return reply(C.err('Mention a channel.'));
    setGuild(guildId, 'mod_channel_id', opts.channel.id);
    return reply(C.ok(`Mod log channel set to <#${opts.channel.id}>.`));
  }

  if (sub === 'muterole') {
    if (!opts.role) return reply(C.err('Mention a role.'));
    setGuild(guildId, 'mute_role_id', opts.role.id);
    return reply(C.ok(`Mute role set to <@&${opts.role.id}>.`));
  }

  return reply(C.err('Unknown subcommand. Use: `view`, `verifiedrole`, `logchannel`, `modchannel`, `muterole`.'));
}
