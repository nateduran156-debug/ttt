'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { card, err, loading, COLORS } = require('../../utils/components');
const { getUser, getHeadshot }       = require('../../utils/roblox');
const { linkUser }                   = require('../../utils/database');
const { syncMember }                 = require('../../utils/ranksync');

const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('link your Roblox account to Discord')
  .addStringOption(o => o.setName('username').setDescription('your Roblox username').setRequired(true));

const category   = 'roblox';
const prefixName = 'verify';
const aliases    = ['link', 'rverify'];

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString('username');
  await interaction.editReply(loading(`Looking up **${username}**...`));
  const rUser = await getUser(username).catch(() => null);
  if (!rUser) return interaction.editReply(err(`**${username}** not found on Roblox.`));
  linkUser(interaction.user.id, interaction.guild.id, String(rUser.id), rUser.name);
  const headshot = await getHeadshot(rUser.id).catch(() => null);
  await interaction.editReply(card({
    title: 'Account Linked',
    desc:  `**Discord** ${interaction.user}\n**Roblox** [${rUser.displayName}](https://www.roblox.com/users/${rUser.id}/profile)\n**Roblox ID** \`${rUser.id}\``,
    color: COLORS.green,
    image: headshot || undefined,
  }));
  syncMember(interaction.guild, interaction.member, String(rUser.id)).catch(() => {});
}

async function prefixExecute(message, args) {
  const username = args[0];
  if (!username) return message.reply(err('Provide your Roblox username.'));
  const m     = await message.reply(loading(`Looking up ${username}...`));
  const rUser = await getUser(username).catch(() => null);
  if (!rUser) return m.edit(err(`**${username}** not found.`));
  linkUser(message.author.id, message.guild.id, String(rUser.id), rUser.name);
  await m.edit(card({
    title: 'Account Linked',
    desc:  `Linked **${message.author.username}** → **${rUser.displayName}** (\`${rUser.id}\`)`,
    color: COLORS.green,
  }));
}

module.exports = { data, execute, prefixExecute, prefixName, aliases, category };
