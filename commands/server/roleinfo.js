'use strict';

const { card, err, COLORS } = require('../../utils/components');

const category   = 'server';
const prefixName = 'roleinfo';
const aliases    = ['ri', 'rinfo'];

async function prefixExecute(message, args) {
  const role = message.mentions.roles.first()
    || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
  if (!role) return message.reply(err('Mention a role or provide its name.'));

  return message.reply(card({
    title:  `@${role.name}`,
    fields: [
      { name: 'ID',          value: `\`${role.id}\`` },
      { name: 'Color',       value: role.hexColor },
      { name: 'Members',     value: `${role.members.size}` },
      { name: 'Position',    value: `${role.position}` },
      { name: 'Hoisted',     value: role.hoist ? 'Yes' : 'No' },
      { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No' },
      { name: 'Managed',     value: role.managed ? 'Yes (Bot/Integration)' : 'No' },
      { name: 'Created',     value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>` },
    ],
    color: role.color || COLORS.blue,
  }));
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('show details about a role')
  .addRoleOption(o => o.setName('role').setDescription('role to inspect').setRequired(true));

async function execute(interaction) {
  const role = interaction.options.getRole('role');
  await interaction.reply(card({
    title:  role.name,
    fields: [
      { name: 'ID',         value: role.id,                                                                      inline: true },
      { name: 'Color',      value: role.hexColor,                                                                inline: true },
      { name: 'Members',    value: String(interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size), inline: true },
      { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No',                                            inline: true },
      { name: 'Hoisted',    value: role.hoist ? 'Yes' : 'No',                                                   inline: true },
      { name: 'Position',   value: String(role.position),                                                        inline: true },
      { name: 'Created',    value: `<t:${Math.floor(role.createdAt.getTime() / 1000)}:R>`,                       inline: true },
    ],
    color: role.color || COLORS.blue,
  }));
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
