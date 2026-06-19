'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { parseDuration }       = require('../../utils/time');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'tempban';
const aliases    = ['tb', 'tban'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
    return message.reply(err('You need the **Ban Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to temp-ban.'));
  if (!member.bannable) return message.reply(err('I cannot ban that member.'));

  const ms     = parseDuration(args[1]);
  if (!ms) return message.reply(err('Provide a valid duration. Examples: `1h`, `7d`'));

  const reason  = args.slice(2).join(' ') || 'No reason provided';
  const endsAt  = Math.floor((Date.now() + ms) / 1000);

  try {
    await message.guild.bans.create(member.id, { reason });
    setTimeout(() => message.guild.bans.remove(member.id).catch(() => {}), ms);
    message.reply(modCard({
      action: 'Temp Banned',
      user: member.user,
      mod:  message.author,
      reason,
      extra: { 'Unbanned': `<t:${endsAt}:R>` },
    }));
  } catch (e) {
    message.reply(err(`Temp ban failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('tempban')
  .setDescription('ban a user for a set duration')
  .addUserOption(o => o.setName('user').setDescription('member to tempban').setRequired(true))
  .addStringOption(o => o.setName('duration').setDescription('duration e.g. 1h 7d 30m').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the tempban'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

async function execute(interaction) {
  const user   = interaction.options.getUser('user');
  const durStr = interaction.options.getString('duration');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const ms     = parseDuration(durStr);
  if (!ms) return interaction.reply(err('Invalid duration. Try `1h`, `7d`, `30m`.'));
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (member && !member.bannable) return interaction.reply(err('I cannot ban that member.'));
  try {
    await interaction.guild.members.ban(user, { reason });
    setTimeout(() => interaction.guild.members.unban(user.id, 'Tempban expired').catch(() => {}), ms);
    const until = `<t:${Math.floor((Date.now() + ms) / 1000)}:R>`;
    await interaction.reply(modCard({ action: 'Tempban', user, mod: interaction.user, reason, extra: `Unbanned ${until}` }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
