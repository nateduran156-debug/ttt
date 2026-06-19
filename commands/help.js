'use strict';

const { card, COLORS, CV2 } = require('../utils/components');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');
const { getPrefix } = require('../utils/database');

const category   = 'all';
const prefixName = 'help';
const aliases    = ['h', 'commands'];

const S = (d = true) => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(d);

const COMMAND_LIST = {
  '⚙️ Core': [
    '`wl` — manage the whitelist',
    '`sniper` — manage Roblox username sniper targets',
    '`tag` — create and use custom tags',
    '`verify` — link your Roblox account',
    '`setprefix` — change the bot prefix',
    '`setcookie` — store the Roblox cookie',
    '`setupticket` — configure the ticket system',
    '`automod` — configure AutoMod',
    '`help` — display this message',
  ],
  '🔨 Moderation': [
    '`ban`, `kick`, `warn`, `unban`, `softban`, `tempban`, `massban`',
    '`timeout`, `purge`, `nick`, `note`, `history`, `warnings`, `clearwarns`',
    '`lock`, `lockall`, `unlock`, `unlockall`, `nuke`',
    '`deafen`, `undeafen`, `move`, `slowmode`',
    '`addrole`, `removerole`, `roleall`, `unroleall`',
    '`createchannel`, `deletechannel`, `createrole`, `deleterole`, `clonechannel`',
  ],
  '📊 Server Info': [
    '`serverinfo`, `userinfo`, `avatar`, `banner`',
    '`roleinfo`, `channelinfo`, `roles`, `channels`, `emoji`',
    '`boosters`, `bots`, `humans`, `membercount`, `invites`',
  ],
  '🎮 Roblox': [
    '`roblox` — look up a Roblox user',
    '`presence` — check online status',
    '`groupinfo`, `groupcheck`, `groupwall`',
    '`friends`, `badges`, `games`, `outfit`, `rap`, `linked`',
  ],
  '🎁 Giveaway': [
    '`giveaway start/end/list` — manage giveaways',
  ],
  '👋 Welcome': [
    '`welcome` — configure welcome messages and auto-roles',
  ],
  '📋 Logging': [
    '`setlogs` — configure log channels',
  ],
  '🛡️ AntiNuke': [
    '`antinuke` — configure the AntiNuke protection system',
  ],
  '⚔️ Raid Points': [
    '`raidpoints add/remove/check/top/reset/transfer/season`',
  ],
  '🎲 Misc': [
    '`ping`, `botinfo`',
    '`alias` — manage custom command shortcuts',
    '`autoresponder` — manage auto-reply triggers',
    '`rankroles` — manage rank-point role thresholds',
  ],
};

async function prefixExecute(message, args) {
  const prefix = getPrefix(message.guild?.id || '0');
  const c      = new ContainerBuilder().setAccentColor(COLORS.blue);

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Command Reference — prefix: \`${prefix}\``));

  for (const [section, lines] of Object.entries(COMMAND_LIST)) {
    c.addSeparatorComponents(S())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${section}**\n${lines.join('\n')}`
      ));
  }

  c.addSeparatorComponents(S(false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# Only whitelisted users may use the bot. Use \`${prefix}wl\` to manage access.`
    ));

  return message.reply({ flags: require('discord.js').MessageFlags.IsComponentsV2, components: [c] });
}

module.exports = { prefixName, aliases, category, prefixExecute };
