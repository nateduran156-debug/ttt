'use strict';

const { getGuild, ensureGuild } = require('../utils/database');
const { sendLog }               = require('../utils/logger');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const CV2 = MessageFlags.IsComponentsV2;

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    ensureGuild(guild.id);
    const g = getGuild(guild.id);

    await sendLog(guild, 'join', {
      color: 0x57F287,
      content: [
        `👋 **Joined** — ${member.user} \`${member.user.username}\` (Member #${guild.memberCount})`,
        `-# Account created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
      ].join('\n'),
    });

    if (!g.welcome_enabled || !g.welcome_channel) return;

    const ch = guild.channels.cache.get(g.welcome_channel);
    if (!ch) return;

    // Give configured auto-roles
    const roles = JSON.parse(g.welcome_roles || '[]');
    for (const rid of roles) {
      const role = guild.roles.cache.get(rid);
      if (role) member.roles.add(role).catch(() => {});
    }

    const msg = (g.welcome_message || 'Welcome {user} to **{server}**!')
      .replace('{user}',        `${member}`)
      .replace('{username}',    member.user.username)
      .replace('{server}',      guild.name)
      .replace('{membercount}', guild.memberCount);

    const c = new ContainerBuilder()
      .setAccentColor(0x57F287)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Welcome to ${guild.name}!`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${msg}\n\n**Member** ${member} (${member.user.username})\n**Joined as** #${guild.memberCount}\n**Account created** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
      ));

    ch.send({ flags: CV2, components: [c] }).catch(() => {});

    if (g.welcome_dm) {
      const dm = (g.welcome_dm_message || `Welcome to **${guild.name}**!`)
        .replace('{user}',   member.user.username)
        .replace('{server}', guild.name);
      member.user.send({ content: dm }).catch(() => {});
    }
  },
};
