'use strict';

const {
  SlashCommandBuilder,
  ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const { getGuild } = require('../../utils/database');

const CV2 = MessageFlags.IsComponentsV2;
const EPH = 1 << 6;
const S   = (size = SeparatorSpacingSize.Small, div = true) =>
  new SeparatorBuilder().setSpacing(size).setDivider(div);

// ─── Command registry ────────────────────────────────────────────────────────

const CATS = {
  moderation: {
    label: 'moderation', color: 0xED4245,
    cmds: [
      { name: 'ban',           desc: 'Permanently ban a user from the server.',                aliases: ['!ban', '!hackban'],         parameters: 'user: @user [reason] [days]',            info: 'n/a', usage: '.ban @user [reason]',            example: '.ban @BadActor spam' },
      { name: 'kick',          desc: 'Remove a user from the server.',                         aliases: ['!kick', '!k'],              parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.kick @user [reason]',           example: '.kick @Troll rule breaking' },
      { name: 'unban',         desc: 'Lift a ban so the user can rejoin.',                     aliases: ['!unban'],                   parameters: 'user_id: <id> [reason]',                 info: 'n/a', usage: '.unban <id> [reason]',           example: '.unban 123456789012345678' },
      { name: 'warn',          desc: 'Issue a logged warning to a member.',                    aliases: ['!warn'],                    parameters: 'user: @user reason: <text>',             info: 'n/a', usage: '.warn @user <reason>',           example: '.warn @Member excessive pinging' },
      { name: 'warnings',      desc: 'List all active warnings for a user.',                   aliases: ['!warnings', '!warns'],      parameters: 'user: @user',                            info: 'n/a', usage: '.warnings @user',               example: '.warnings @Repeat' },
      { name: 'clearwarns',    desc: 'Clear all warnings from a user\'s record.',              aliases: ['!clearwarns'],              parameters: 'user: @user',                            info: 'n/a', usage: '.clearwarns @user',             example: '.clearwarns @Reformed' },
      { name: 'history',       desc: 'View full moderation history for a user.',               aliases: ['!history', '!mh'],          parameters: 'user: @user',                            info: 'n/a', usage: '.history @user',                example: '.history @Suspect' },
      { name: 'timeout',       desc: 'Temporarily mute a user.',                               aliases: ['!timeout', '!mute'],        parameters: 'user: @user duration: <time> [reason]', info: 'n/a', usage: '.timeout @user <duration>',      example: '.timeout @Spammer 10m spam' },
      { name: 'untimeout',     desc: 'Remove an active timeout.',                              aliases: ['!untimeout', '!unmute'],    parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.untimeout @user',              example: '.untimeout @Calmed' },
      { name: 'purge',         desc: 'Bulk-delete messages in a channel.',                     aliases: ['!purge', '!clear'],         parameters: 'amount: <1-100> [user: @user]',          info: 'n/a', usage: '.purge <amount> [@user]',        example: '.purge 50 @Spammer' },
      { name: 'lock',          desc: 'Prevent @everyone from sending messages in a channel.',  aliases: ['!lock'],                    parameters: '[#channel] [reason]',                    info: 'n/a', usage: '.lock [#channel] [reason]',     example: '.lock #general heated discussion' },
      { name: 'unlock',        desc: 'Restore send permissions in a channel.',                 aliases: ['!unlock'],                  parameters: '[#channel]',                             info: 'n/a', usage: '.unlock [#channel]',            example: '.unlock #general' },
      { name: 'lockall',       desc: 'Lock every text channel in the server.',                 aliases: ['!lockall', '!serverlock'], parameters: '[reason]',                               info: 'n/a', usage: '.lockall [reason]',             example: '.lockall raid in progress' },
      { name: 'unlockall',     desc: 'Unlock all previously locked channels.',                 aliases: ['!unlockall'],               parameters: 'n/a',                                    info: 'n/a', usage: '.unlockall',                    example: '.unlockall' },
      { name: 'slowmode',      desc: 'Set a slowmode delay on a channel (0 = off).',           aliases: ['!slowmode', '!slow'],       parameters: 'seconds: <0-21600> [#channel]',          info: 'n/a', usage: '.slowmode <seconds> [#channel]', example: '.slowmode 5 #general' },
      { name: 'nick',          desc: 'Change or reset a member\'s nickname.',                  aliases: ['!nick', '!nickname'],       parameters: 'user: @user [nickname]',                 info: 'n/a', usage: '.nick @user [nickname]',         example: '.nick @Member CoolNick' },
      { name: 'addrole',       desc: 'Give a role to a member.',                               aliases: ['!addrole', '!giverole'],   parameters: 'user: @user role: @role',                info: 'n/a', usage: '.addrole @user @role',          example: '.addrole @NewGuy @Member' },
      { name: 'removerole',    desc: 'Take a role away from a member.',                        aliases: ['!removerole'],              parameters: 'user: @user role: @role',                info: 'n/a', usage: '.removerole @user @role',       example: '.removerole @Member @Booster' },
      { name: 'roleall',       desc: 'Give a role to every member in the server.',             aliases: ['!roleall'],                 parameters: 'role: @role',                            info: 'n/a', usage: '.roleall @role',                example: '.roleall @Verified' },
      { name: 'unroleall',     desc: 'Remove a role from every member.',                       aliases: ['!unroleall'],               parameters: 'role: @role',                            info: 'n/a', usage: '.unroleall @role',              example: '.unroleall @OldMember' },
      { name: 'softban',       desc: 'Ban then immediately unban to wipe recent messages.',    aliases: ['!softban'],                 parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.softban @user [reason]',       example: '.softban @Raider clean messages' },
      { name: 'tempban',       desc: 'Ban a user for a set duration, then auto-unban.',        aliases: ['!tempban'],                 parameters: 'user: @user duration: <time>',           info: 'n/a', usage: '.tempban @user <duration>',     example: '.tempban @Drama 7d' },
      { name: 'massban',       desc: 'Ban multiple user IDs at once.',                         aliases: ['!massban', '!bulkban'],    parameters: 'userids: <id1 id2 ...>',                 info: 'n/a', usage: '.massban <id1 id2 ...>',        example: '.massban 111 222 333' },
      { name: 'deafen',        desc: 'Server-deafen a user in voice.',                         aliases: ['!deafen'],                  parameters: 'user: @user',                            info: 'n/a', usage: '.deafen @user',                 example: '.deafen @Loud' },
      { name: 'move',          desc: 'Move a user to another voice channel.',                  aliases: ['!move', '!vmove'],          parameters: 'user: @user channel: #vc',               info: 'n/a', usage: '.move @user #vc',               example: '.move @AFK #general-vc' },
      { name: 'nuke',          desc: 'Clone a channel then delete the original.',              aliases: ['!nuke'],                    parameters: '[reason]',                               info: 'n/a', usage: '.nuke [reason]',                example: '.nuke too toxic' },
      { name: 'createrole',    desc: 'Create a new role.',                                     aliases: ['!createrole', '!cr'],       parameters: 'name: <name>',                           info: 'n/a', usage: '.createrole <name>',            example: '.createrole Regulars' },
      { name: 'deleterole',    desc: 'Delete an existing role.',                               aliases: ['!deleterole'],              parameters: 'role: @role',                            info: 'n/a', usage: '.deleterole @role',             example: '.deleterole @TempRole' },
      { name: 'createchannel', desc: 'Create a new text or voice channel.',                    aliases: ['!createchannel', '!cc'],    parameters: 'name: <name> [type: text|voice]',        info: 'n/a', usage: '.createchannel <name>',         example: '.createchannel announcements' },
      { name: 'deletechannel', desc: 'Delete a channel from the server.',                      aliases: ['!deletechannel'],           parameters: 'channel: #channel',                      info: 'n/a', usage: '.deletechannel #channel',       example: '.deletechannel #old-chat' },
      { name: 'clonechannel',  desc: 'Duplicate a channel and its permissions.',               aliases: ['!clonechannel', '!clone'],  parameters: '[channel: #channel]',                    info: 'n/a', usage: '.clonechannel [#channel]',      example: '.clonechannel #rules' },
    ],
  },
  antinuke: {
    label: 'security', color: 0xFF6B35,
    cmds: [
      { name: 'antinuke',           desc: 'Manage AntiNuke settings and configurations.',                        aliases: ['an'],                parameters: 'n/a',                          info: 'n/a', usage: '.antinuke',                                  example: '.antinuke' },
      { name: 'antinuke enable',    desc: 'Activate anti-nuke protection for the server.',                       aliases: ['an enable'],         parameters: 'n/a',                          info: 'n/a', usage: '.antinuke enable',                           example: '.antinuke enable' },
      { name: 'antinuke disable',   desc: 'Turn off anti-nuke protection.',                                      aliases: ['an disable'],        parameters: 'n/a',                          info: 'n/a', usage: '.antinuke disable',                          example: '.antinuke disable' },
      { name: 'antinuke status',    desc: 'View the current anti-nuke config, modules and thresholds.',          aliases: ['an status'],         parameters: 'n/a',                          info: 'n/a', usage: '.antinuke status',                           example: '.antinuke status' },
      { name: 'antinuke whitelist', desc: 'Add or remove a trusted user from the anti-nuke whitelist.',         aliases: ['an whitelist'],      parameters: 'add|remove @user',             info: 'n/a', usage: '.antinuke whitelist <add|remove> @user',     example: '.antinuke whitelist add @Admin' },
      { name: 'antinuke threshold', desc: 'Set how many actions trigger anti-nuke for an event type.',          aliases: ['an threshold'],      parameters: 'module: <name> count: <n>',    info: 'n/a', usage: '.antinuke threshold <module> <count>',       example: '.antinuke threshold ban 2' },
      { name: 'antinuke module',    desc: 'Toggle a specific anti-nuke detection module on or off.',            aliases: ['an module'],         parameters: 'module: <name> state: on|off', info: 'n/a', usage: '.antinuke module <name> <on|off>',           example: '.antinuke module ban on' },
      { name: 'antinuke punish',    desc: 'Set what happens when a nuke threshold is hit.',                     aliases: ['an punish'],         parameters: 'type: ban|kick|strip',         info: 'n/a', usage: '.antinuke punish <ban|kick|strip>',          example: '.antinuke punish ban' },
      { name: 'antinuke window',    desc: 'Set the time window (in seconds) for action counting.',              aliases: ['an window'],         parameters: 'seconds: <1-60>',              info: 'n/a', usage: '.antinuke window <seconds>',                 example: '.antinuke window 10' },
      { name: 'antinuke log',       desc: 'Set the channel where anti-nuke events are logged.',                 aliases: ['an log'],            parameters: 'channel: #channel',            info: 'n/a', usage: '.antinuke log #channel',                     example: '.antinuke log #security-logs' },
    ],
  },
  roblox: {
    label: 'roblox', color: 0x00B4D8,
    cmds: [
      { name: 'verify',     desc: 'Link your Roblox account to Discord.',                    aliases: ['link', 'rverify'],          parameters: 'username: <name>',    info: 'n/a', usage: '.verify <username>',     example: '.verify builderman' },
      { name: 'unverify',   desc: 'Unlink your Roblox account from Discord.',               aliases: ['unlink'],                   parameters: 'n/a',                 info: 'n/a', usage: '.unverify',              example: '.unverify' },
      { name: 'linked',     desc: 'Check which Roblox account a Discord user is linked to.',aliases: ['rl'],                       parameters: '[@user]',             info: 'n/a', usage: '.linked [@user]',        example: '.linked @FriendName' },
      { name: 'roblox',     desc: 'Look up a Roblox user — profile, avatar, badges.',       aliases: ['rb', 'rblx', 'lookup'],    parameters: 'username or id',       info: 'n/a', usage: '.roblox <username>',     example: '.roblox Roblox' },
      { name: 'groupcheck', desc: 'List all groups a Roblox user is in with their rank.',   aliases: ['gc', 'grouprank'],          parameters: '[username or @user]', info: 'n/a', usage: '.gc [username]',         example: '.gc builderman' },
      { name: 'groupinfo',  desc: 'Show info about a Roblox group.',                        aliases: ['group', 'gi'],              parameters: 'groupid: <id>',       info: 'n/a', usage: '.groupinfo <id>',        example: '.groupinfo 1234567' },
      { name: 'groupwall',  desc: 'View recent group wall posts.',                           aliases: ['gwall'],                    parameters: '[groupid: <id>]',     info: 'n/a', usage: '.groupwall [id]',        example: '.groupwall 1234567' },
      { name: 'tag',        desc: 'Apply a Roblox group tag to a user.',                    aliases: ['t'],                        parameters: 'username tag',        info: 'Tags: 164, lurk tag, AMOR TAG, KITTY TAG, YinYang', usage: '.tag <username> <tag>', example: '.tag builderman lurk tag' },
      { name: 'rank',       desc: 'Change a Roblox user\'s rank in your group.',            aliases: ['setrank'],                  parameters: 'username rank',       info: 'Requires .setcookie first', usage: '.rank <username> <rank>', example: '.rank builderman Officer' },
      { name: 'setgroup',   desc: 'Link a Roblox group to this server.',                    aliases: ['linkgroup', 'sg'],          parameters: 'groupid: <id>',       info: 'n/a', usage: '.setgroup <id>',         example: '.setgroup 1234567' },
      { name: 'shout',      desc: 'Update your Roblox group shout.',                        aliases: [],                           parameters: 'message: <text>',     info: 'Requires cookie', usage: '.shout <message>',      example: '.shout Meeting in 30 min!' },
      { name: 'game',       desc: 'Look up a Roblox game by place ID.',                     aliases: [],                           parameters: 'placeid: <id>',       info: 'n/a', usage: '.game <placeid>',        example: '.game 920587237' },
      { name: 'rap',        desc: 'Get total RAP for a Roblox user\'s limiteds.',           aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.rap <username>',        example: '.rap builderman' },
      { name: 'badges',     desc: 'List the badges a Roblox user has earned.',              aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.badges <username>',     example: '.badges Roblox' },
      { name: 'friends',    desc: 'Show a Roblox user\'s friends list.',                    aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.friends <username>',    example: '.friends builderman' },
      { name: 'outfit',     desc: 'Preview a Roblox user\'s current outfit.',               aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.outfit <username>',     example: '.outfit Roblox' },
      { name: 'presence',   desc: 'Check if a Roblox user is currently online.',            aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.presence <username>',   example: '.presence builderman' },
      { name: 'catalog',    desc: 'Search the Roblox catalog for items.',                   aliases: [],                           parameters: 'query: <text>',       info: 'n/a', usage: '.catalog <query>',       example: '.catalog dragon sword' },
      { name: 'games',      desc: 'List games created by a Roblox user.',                   aliases: [],                           parameters: 'username: <name>',    info: 'n/a', usage: '.games <username>',      example: '.games builderman' },
    ],
  },
  sniper: {
    label: 'sniper', color: 0x57F287,
    cmds: [
      { name: 'sniper add',    desc: 'Get alerted when a Roblox user comes online.',  aliases: ['sn add'],    parameters: 'username [invite] [@role]', info: 'Tracks presence every 30s', usage: '.sniper add <username>',    example: '.sniper add builderman' },
      { name: 'sniper remove', desc: 'Stop sniping a Roblox user.',                   aliases: ['sn remove'], parameters: 'username: <name>',          info: 'n/a',                       usage: '.sniper remove <username>', example: '.sniper remove builderman' },
      { name: 'sniper list',   desc: 'View all users currently being sniped.',        aliases: ['sn list'],   parameters: 'n/a',                       info: 'n/a',                       usage: '.sniper list',             example: '.sniper list' },
      { name: 'sniper channel',desc: 'Change the alert channel for a sniped user.',   aliases: ['sn channel'],parameters: 'username: <name>',          info: 'n/a',                       usage: '.sniper channel <username>',example: '.sniper channel builderman' },
    ],
  },
  giveaway: {
    label: 'giveaway', color: 0xFFD700,
    cmds: [
      { name: 'giveaway start',  desc: 'Start a giveaway with duration, prize, and winners.', aliases: ['gstart'], parameters: 'duration winners prize', info: 'n/a', usage: '.giveaway start <time> <winners> <prize>', example: '.giveaway start 24h 1 Robux 1000' },
      { name: 'giveaway end',    desc: 'End a giveaway immediately and pick winners.',         aliases: ['gend'],   parameters: 'message_id: <id>',     info: 'n/a', usage: '.giveaway end <message_id>',               example: '.giveaway end 123456789' },
      { name: 'giveaway reroll', desc: 'Pick a new winner if the original didn\'t claim.',    aliases: [],         parameters: 'message_id: <id>',     info: 'n/a', usage: '.giveaway reroll <message_id>',            example: '.giveaway reroll 123456789' },
      { name: 'giveaway list',   desc: 'List all active giveaways in the server.',            aliases: ['glist'],  parameters: 'n/a',                  info: 'n/a', usage: '.giveaway list',                           example: '.giveaway list' },
    ],
  },
  tickets: {
    label: 'tickets', color: 0x3498DB,
    cmds: [
      { name: 'setupticket',              desc: 'Configure the ticket system.',                   aliases: ['ticket', 'tickets'], parameters: 'n/a',               info: 'n/a', usage: '.setupticket',                       example: '.setupticket status' },
      { name: 'setupticket staffrole',    desc: 'Set the role that can use staff ticket buttons.',aliases: [],                    parameters: 'role: @role',       info: 'Staff can Verify/Kick/Claim/Close', usage: '.setupticket staffrole @role', example: '.setupticket staffrole @Staff' },
      { name: 'setupticket tag',          desc: 'Send a tag request panel in a channel.',         aliases: [],                    parameters: '[#channel]',        info: 'Opens in tag ticket category',      usage: '.setupticket tag [#channel]',  example: '.setupticket tag #get-tag' },
      { name: 'setupticket verify',       desc: 'Send a verification panel in a channel.',        aliases: [],                    parameters: '[#channel]',        info: 'Opens in verify ticket category',   usage: '.setupticket verify [#channel]',example: '.setupticket verify #verify' },
      { name: 'wltagmanager',             desc: 'Whitelist users or roles to use the tag command.',aliases: ['wltag', 'tagwl'],  parameters: 'add|remove|list',   info: 'Fully whitelisted can use Accept User', usage: '.wltagmanager <add|remove> @user', example: '.wltagmanager add @Staff' },
    ],
  },
  raidpoints: {
    label: 'raidpoints', color: 0xE74C3C,
    cmds: [
      { name: 'raidpoints add',      desc: 'Add raid points to a member.',                   aliases: [], parameters: '@user <amount>', info: 'n/a', usage: '.raidpoints add @user <amount>',      example: '.raidpoints add @Raider 25' },
      { name: 'raidpoints remove',   desc: 'Subtract raid points from a member.',            aliases: [], parameters: '@user <amount>', info: 'n/a', usage: '.raidpoints remove @user <amount>',   example: '.raidpoints remove @Member 10' },
      { name: 'raidpoints check',    desc: 'Check a user\'s current raid points.',           aliases: [], parameters: '@user',          info: 'n/a', usage: '.raidpoints check @user',             example: '.raidpoints check @Raider' },
      { name: 'raidpoints top',      desc: 'View the raid points leaderboard.',              aliases: [], parameters: 'n/a',            info: 'n/a', usage: '.raidpoints top',                     example: '.raidpoints top' },
      { name: 'raidpoints season',   desc: 'View or change the current raid season.',        aliases: [], parameters: '[number: <n>]', info: 'n/a', usage: '.raidpoints season [number]',         example: '.raidpoints season 4' },
      { name: 'raidpoints reset',    desc: 'Reset a specific user\'s raid points.',          aliases: [], parameters: '@user',          info: 'n/a', usage: '.raidpoints reset @user',             example: '.raidpoints reset @Member' },
      { name: 'raidpoints transfer', desc: 'Transfer raid points to rank points.',           aliases: [], parameters: '@user [multiplier]', info: 'n/a', usage: '.raidpoints transfer @user [x]', example: '.raidpoints transfer @Raider 2' },
      { name: 'raidpoints panel',   desc: 'Send the raid leaderboard as a panel in a channel.', aliases: [], parameters: '[#channel]', info: 'n/a', usage: '.raidpoints panel [#channel]', example: '.raidpoints panel #leaderboard' },
      { name: 'setrank',            desc: 'Set a raid points threshold to auto-grant a role.',  aliases: ['sr'], parameters: '<role_id> <points>', info: 'Auto-strips role if points drop below threshold', usage: '.setrank <role_id> <points>', example: '.setrank 123456789012345678 50' },
      { name: 'setrank list',       desc: 'View all configured auto-promo raid rank roles.',    aliases: [], parameters: 'n/a', info: 'n/a', usage: '.setrank list', example: '.setrank list' },
      { name: 'setrank remove',     desc: 'Remove a raid rank role threshold.',                 aliases: [], parameters: '<role_id>', info: 'n/a', usage: '.setrank remove <role_id>', example: '.setrank remove 123456789012345678' },
    ],
  },
  misc: {
    label: 'misc', color: 0x99AAB5,
    cmds: [
      { name: 'ping',          desc: 'Check the bot\'s latency and API response time.',     aliases: [],             parameters: 'n/a',          info: 'n/a', usage: '.ping',              example: '.ping' },
      { name: 'botinfo',       desc: 'Show info about the bot — uptime, guilds, memory.',  aliases: [],             parameters: 'n/a',          info: 'n/a', usage: '.botinfo',           example: '.botinfo' },
      { name: 'help',          desc: 'List commands or browse a specific module.',          aliases: ['h', 'cmds'],  parameters: '[module]',     info: 'n/a', usage: '.help [module]',     example: '.help antinuke' },
      { name: 'setprefix',     desc: 'Change the bot command prefix for this server.',     aliases: ['prefix'],     parameters: 'prefix: <p>',  info: 'n/a', usage: '.setprefix <char>',  example: '.setprefix !' },
      { name: 'setcookie',     desc: 'Store the Roblox .ROBLOSECURITY cookie.',            aliases: [],             parameters: 'cookie: <c>',  info: 'Needed for rank/tag/shout', usage: '.setcookie <cookie>', example: '.setcookie _|WARNING...' },
      { name: 'setlogs',       desc: 'Configure log channels for server events.',          aliases: [],             parameters: 'type #channel',info: 'n/a', usage: '.setlogs <type> #ch',example: '.setlogs mod #mod-logs' },
      { name: 'alias',         desc: 'Manage custom command shortcuts.',                   aliases: [],             parameters: 'n/a',          info: 'n/a', usage: '.alias add <a> <b>', example: '.alias add kick .kick' },
      { name: 'autoresponder', desc: 'Manage auto-reply triggers for this server.',        aliases: ['ar'],         parameters: 'n/a',          info: 'n/a', usage: '.autoresponder',     example: '.autoresponder list' },
      { name: 'sniper',        desc: 'Manage Roblox username tracking alerts.',            aliases: ['sn'],         parameters: 'n/a',          info: 'n/a', usage: '.sniper',            example: '.sniper list' },
      { name: 'vanity',        desc: 'Monitor Discord vanity URLs for activity.',          aliases: [],             parameters: 'n/a',          info: 'n/a', usage: '.vanity',            example: '.vanity add hollowk' },
    ],
  },
};

// Flatten all commands for total count
const ALL_CMDS = Object.values(CATS).flatMap(c => c.cmds);

// ─── Builders ────────────────────────────────────────────────────────────────

function navRow(catKey, page, authorId) {
  const total = CATS[catKey].cmds.length;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev:${catKey}:${authorId}`)
      .setLabel('<')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`help_next:${catKey}:${authorId}`)
      .setLabel('>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= total - 1),
    new ButtonBuilder()
      .setCustomId(`help_sort:${catKey}:${authorId}`)
      .setLabel('↕')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`help_close:${catKey}:${authorId}`)
      .setLabel('×')
      .setStyle(ButtonStyle.Danger),
  );
}

function cmdPage(catKey, page, authorId) {
  const cat   = CATS[catKey];
  const cmd   = cat.cmds[page];
  const total = cat.cmds.length;

  const aliasStr = cmd.aliases?.length ? cmd.aliases.join(', ') : 'n/a';
  const params   = cmd.parameters ?? 'n/a';
  const info     = cmd.info ?? 'n/a';

  const c = new ContainerBuilder()
    .setAccentColor(0x000000)
    // Command name + description
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${cmd.name}`))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`> ${cmd.desc}`))
    .addSeparatorComponents(S())
    // Aliases / Parameters / Information / Usage label
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      [
        `**Aliases**\n${aliasStr}`,
        `**Parameters**\n${params}`,
        `**Information**\n${info}`,
        `**Usage**`,
      ].join('\n')
    ))
    // Usage code block
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `\`\`\`\nSyntax:   ${cmd.usage}\nExample:  ${cmd.example}\n\`\`\``
    ))
    .addSeparatorComponents(S(SeparatorSpacingSize.Small, false))
    // Footer
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# Page ${page + 1}/${total} (${total} entries) · Module: ${cat.label}`
    ));

  return { flags: CV2, components: [c, navRow(catKey, page, authorId)] };
}

function mainPage(prefix) {
  const lines = Object.entries(CATS).map(([, cat]) =>
    `**${cat.label}** — ${cat.cmds.length} commands`
  );
  const c = new ContainerBuilder()
    .setAccentColor(0x000000)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Command Reference`))
    .addSeparatorComponents(S())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
    .addSeparatorComponents(S(SeparatorSpacingSize.Small, false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# ${ALL_CMDS.length} commands total · prefix \`${prefix}\` · use \`${prefix}help <module>\` to browse`
    ));
  return { flags: CV2, components: [c] };
}

// ─── Collector helper ────────────────────────────────────────────────────────

function attachCollector(msg, catKey, getPage, setPage, authorId) {
  const col = msg.createMessageComponentCollector({ time: 120_000 });
  col.on('collect', async i => {
    const [action,, aid] = i.customId.split(':');
    if (aid !== authorId) {
      const c = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('This menu is not for you.'));
      return i.reply({ flags: CV2 | EPH, components: [c] });
    }
    if (action === 'help_close') {
      col.stop('closed');
      return i.update({ flags: CV2, components: [i.message.components[0]] }).catch(() => {});
    }
    const total = CATS[catKey].cmds.length;
    if (action === 'help_prev') setPage(Math.max(0, getPage() - 1));
    if (action === 'help_next') setPage(Math.min(total - 1, getPage() + 1));
    await i.update(cmdPage(catKey, getPage(), authorId));
  });
  col.on('end', (_, reason) => {
    if (reason === 'closed') return;
    const base = cmdPage(catKey, getPage(), authorId);
    msg.edit({ ...base, components: [base.components[0]] }).catch(() => {});
  });
}

// ─── Slash command ───────────────────────────────────────────────────────────

const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('list commands or view a category')
  .addStringOption(o =>
    o.setName('category')
      .setDescription('module to browse')
      .addChoices(...Object.entries(CATS).map(([k, v]) => ({ name: v.label, value: k })))
  );

const category   = 'misc';
const prefixName = 'help';
const aliases    = ['h', 'commands', 'cmds'];

async function execute(interaction) {
  const prefix = getGuild(interaction.guild.id).prefix || '.';
  const catArg = interaction.options.getString('category');
  if (!catArg) return interaction.reply(mainPage(prefix));

  let page = 0;
  const aid = interaction.user.id;
  const msg = await interaction.reply({ ...cmdPage(catArg, page, aid), fetchReply: true });
  attachCollector(msg, catArg, () => page, p => { page = p; }, aid);
}

async function prefixExecute(message, args) {
  const prefix = getGuild(message.guild.id).prefix || '.';
  const catArg = args[0]?.toLowerCase();
  if (!catArg || !CATS[catArg]) return message.reply(mainPage(prefix));

  let page = 0;
  const aid = message.author.id;
  const msg = await message.reply({ ...cmdPage(catArg, page, aid), fetchReply: true });
  attachCollector(msg, catArg, () => page, p => { page = p; }, aid);
}

// ─── CMD_META for backward-compat ────────────────────────────────────────────

const CMD_META = Object.fromEntries(
  Object.entries(CATS).flatMap(([, cat]) =>
    cat.cmds.map(cmd => [cmd.name, { ...cmd, color: cat.color, label: cat.label }])
  )
);

// ─── Quick command help card (no nav buttons, for inline use) ────────────────

function quickCmdHelp(cmdName) {
  const meta = CMD_META[cmdName];
  if (!meta) {
    const c = new ContainerBuilder()
      .setAccentColor(0x000000)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${cmdName}\nNo help available for this command.`));
    return { flags: CV2, components: [c] };
  }
  const aliasStr = meta.aliases?.length ? meta.aliases.join(', ') : 'n/a';
  const c = new ContainerBuilder()
    .setAccentColor(0x000000)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${meta.name}`))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`> ${meta.desc}`))
    .addSeparatorComponents(S())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      [
        `**Aliases**\n${aliasStr}`,
        `**Parameters**\n${meta.parameters ?? 'n/a'}`,
        `**Information**\n${meta.info ?? 'n/a'}`,
        `**Usage**`,
      ].join('\n')
    ))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `\`\`\`\nSyntax:   ${meta.usage}\nExample:  ${meta.example}\n\`\`\``
    ))
    .addSeparatorComponents(S(SeparatorSpacingSize.Small, false))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# Module: ${meta.label}`
    ));
  return { flags: CV2, components: [c] };
}

module.exports = { data, CMD_META, quickCmdHelp, execute, prefixExecute, prefixName, aliases, category };
