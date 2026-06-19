'use strict';

const { ok, err, modCard }   = require('../../utils/components');
const { parseDuration }       = require('../../utils/time');
const { PermissionFlagsBits } = require('discord.js');

const category   = 'moderation';
const prefixName = 'timeout';
const aliases    = ['mute', 'to'];

async function prefixExecute(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
    return message.reply(err('You need the **Moderate Members** permission.'));

  const member = message.mentions.members.first();
  if (!member) return message.reply(err('Mention a member to time out.'));

  const durationStr = args[1];
  const reason      = args.slice(2).join(' ') || 'No reason provided';

  if (!durationStr) {
    // Remove timeout
    if (!member.communicationDisabledUntil) return message.reply(err('That member is not currently timed out.'));
    await member.timeout(null, reason);
    return message.reply(ok(`Timeout removed for ${member}.`));
  }

  const ms = parseDuration(durationStr);
  if (!ms) return message.reply(err('Invalid duration. Examples: `30m`, `1h`, `1d` (max 28 days).'));
  if (ms > 2419200000) return message.reply(err('Timeout duration cannot exceed 28 days.'));

  try {
    await member.timeout(ms, reason);
    const endsAt = Math.floor((Date.now() + ms) / 1000);
    await message.reply(modCard({
      action: 'Timed Out',
      user:   member.user,
      mod:    message.author,
      reason,
      extra:  { 'Expires': `<t:${endsAt}:R>` },
    }));
  } catch (e) {
    message.reply(err(`Timeout failed: ${e.message}`));
  }
}

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('temporarily mute a member')
  .addUserOption(o => o.setName('user').setDescription('member to timeout').setRequired(true))
  .addStringOption(o => o.setName('duration').setDescription('duration e.g. 10m 1h 7d').setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('reason for the timeout'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

async function execute(interaction) {
  const user     = interaction.options.getUser('user');
  const durStr   = interaction.options.getString('duration');
  const reason   = interaction.options.getString('reason') || 'No reason provided';
  const member   = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply(err('That user is not in this server.'));
  const ms = parseDuration(durStr);
  if (!ms || ms < 1000) return interaction.reply(err('Invalid duration. Try `10m`, `1h`, `7d`.'));
  if (ms > 28 * 24 * 60 * 60 * 1000) return interaction.reply(err('Maximum timeout is 28 days.'));
  try {
    await member.timeout(ms, reason);
    const until = `<t:${Math.floor((Date.now() + ms) / 1000)}:R>`;
    await interaction.reply(modCard({ action: 'Timeout', user, mod: interaction.user, reason, extra: `Expires ${until}` }));
  } catch (e) {
    await interaction.reply(err(`Failed: ${e.message}`));
  }
}

module.exports = { data, execute, prefixName, aliases, category, prefixExecute };
