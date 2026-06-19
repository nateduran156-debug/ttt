'use strict';

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

// ─── Full command registry ───────────────────────────────────────────────────
// prefix placeholder is "." — callers substitute the real server prefix

const CATS = {
  moderation: {
    label: 'moderation', color: 0xED4245,
    cmds: [
      { name: 'ban',           desc: 'Permanently bans someone from the server. They won\'t be able to rejoin unless you unban them.',        aliases: 'b, banish',             parameters: 'user: @user [reason] [days]',            info: 'n/a', usage: '.ban @user [reason]',            example: '.ban @BadActor spam' },
      { name: 'kick',          desc: 'Kicks someone out of the server. They can still rejoin with an invite.',                                aliases: 'k',                      parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.kick @user [reason]',           example: '.kick @Troll rule breaking' },
      { name: 'unban',         desc: 'Removes a ban so the user can rejoin the server again.',                                                aliases: 'n/a',                    parameters: 'user_id: <id> [reason]',                 info: 'n/a', usage: '.unban <id> [reason]',           example: '.unban 123456789012345678' },
      { name: 'warn',          desc: 'Gives a user a logged warning. Warnings stack up and can be reviewed later.',                           aliases: 'n/a',                    parameters: 'user: @user reason: <text>',             info: 'n/a', usage: '.warn @user <reason>',           example: '.warn @Member excessive pinging' },
      { name: 'warnings',      desc: 'Shows all active warnings on a user\'s record.',                                                        aliases: 'warns',                  parameters: 'user: @user',                            info: 'n/a', usage: '.warnings @user',               example: '.warnings @Repeat' },
      { name: 'clearwarns',    desc: 'Wipes all warnings from a user\'s record completely.',                                                  aliases: 'n/a',                    parameters: 'user: @user',                            info: 'n/a', usage: '.clearwarns @user',             example: '.clearwarns @Reformed' },
      { name: 'history',       desc: 'Pulls up the full moderation history for a user — bans, kicks, warns, all of it.',                      aliases: 'mh',                     parameters: 'user: @user',                            info: 'n/a', usage: '.history @user',                example: '.history @Suspect' },
      { name: 'timeout',       desc: 'Temporarily mutes a user for a set amount of time. They can\'t send messages or join VCs.',             aliases: 'mute',                   parameters: 'user: @user duration: <time> [reason]', info: 'n/a', usage: '.timeout @user <duration>',      example: '.timeout @Spammer 10m spam' },
      { name: 'untimeout',     desc: 'Removes a timeout early so the user can talk again.',                                                   aliases: 'unmute',                 parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.untimeout @user',              example: '.untimeout @Calmed' },
      { name: 'purge',         desc: 'Bulk-deletes messages in the channel. You can target a specific user too.',                             aliases: 'clear',                  parameters: 'amount: <1-100> [user: @user]',          info: 'n/a', usage: '.purge <amount> [@user]',        example: '.purge 50 @Spammer' },
      { name: 'lock',          desc: 'Locks a channel so @everyone can\'t send messages. Good for cooling things down.',                      aliases: 'n/a',                    parameters: '[#channel] [reason]',                    info: 'n/a', usage: '.lock [#channel] [reason]',     example: '.lock #general heated discussion' },
      { name: 'unlock',        desc: 'Unlocks a channel and restores send permissions for everyone.',                                         aliases: 'n/a',                    parameters: '[#channel]',                             info: 'n/a', usage: '.unlock [#channel]',            example: '.unlock #general' },
      { name: 'lockall',       desc: 'Locks every text channel in the server at once. Use during raids or emergencies.',                      aliases: 'serverlock',             parameters: '[reason]',                               info: 'n/a', usage: '.lockall [reason]',             example: '.lockall raid in progress' },
      { name: 'unlockall',     desc: 'Unlocks all channels that were locked — basically the reverse of lockall.',                             aliases: 'n/a',                    parameters: 'n/a',                                    info: 'n/a', usage: '.unlockall',                    example: '.unlockall' },
      { name: 'slowmode',      desc: 'Sets a slowmode delay on a channel. Set it to 0 to turn slowmode off.',                                 aliases: 'slow',                   parameters: 'seconds: <0-21600> [#channel]',          info: 'n/a', usage: '.slowmode <seconds> [#channel]', example: '.slowmode 5 #general' },
      { name: 'nick',          desc: 'Changes or clears a member\'s nickname. Leave the name blank to reset it.',                             aliases: 'nickname',               parameters: 'user: @user [nickname]',                 info: 'n/a', usage: '.nick @user [nickname]',         example: '.nick @Member CoolNick' },
      { name: 'addrole',       desc: 'Gives a role to a specific member.',                                                                    aliases: 'giverole',               parameters: 'user: @user role: @role',                info: 'n/a', usage: '.addrole @user @role',          example: '.addrole @NewGuy @Member' },
      { name: 'removerole',    desc: 'Takes a role away from a member.',                                                                      aliases: 'n/a',                    parameters: 'user: @user role: @role',                info: 'n/a', usage: '.removerole @user @role',       example: '.removerole @Member @Booster' },
      { name: 'roleall',       desc: 'Gives a role to every single member in the server at once.',                                            aliases: 'n/a',                    parameters: 'role: @role',                            info: 'n/a', usage: '.roleall @role',                example: '.roleall @Verified' },
      { name: 'unroleall',     desc: 'Removes a role from every member in the server.',                                                       aliases: 'n/a',                    parameters: 'role: @role',                            info: 'n/a', usage: '.unroleall @role',              example: '.unroleall @OldMember' },
      { name: 'softban',       desc: 'Bans then immediately unbans someone to wipe their recent messages without actually keeping them banned.',aliases: 'n/a',                   parameters: 'user: @user [reason]',                   info: 'n/a', usage: '.softban @user [reason]',       example: '.softban @Raider clean messages' },
      { name: 'tempban',       desc: 'Bans someone for a set amount of time, then automatically unbans them when it expires.',                 aliases: 'n/a',                    parameters: 'user: @user duration: <time>',           info: 'n/a', usage: '.tempban @user <duration>',     example: '.tempban @Drama 7d' },
      { name: 'massban',       desc: 'Bans multiple users by ID in one go. Useful for cleaning up after a raid.',                             aliases: 'bulkban',                parameters: 'userids: <id1 id2 ...>',                 info: 'n/a', usage: '.massban <id1 id2 ...>',        example: '.massban 111 222 333' },
      { name: 'deafen',        desc: 'Server-deafens a user in voice so they can\'t hear anything.',                                          aliases: 'n/a',                    parameters: 'user: @user',                            info: 'n/a', usage: '.deafen @user',                 example: '.deafen @Loud' },
      { name: 'undeafen',      desc: 'Removes the server-deafen from a user so they can hear again.',                                         aliases: 'undeaf, ud',             parameters: 'user: @user',                            info: 'n/a', usage: '.undeafen @user',               example: '.undeafen @Loud' },
      { name: 'move',          desc: 'Moves a user to a different voice channel.',                                                            aliases: 'vmove',                  parameters: 'user: @user channel: #vc',               info: 'n/a', usage: '.move @user #vc',               example: '.move @AFK #general-vc' },
      { name: 'nuke',          desc: 'Clones the current channel and deletes the original, clearing all messages.',                           aliases: 'n/a',                    parameters: '[reason]',                               info: 'n/a', usage: '.nuke [reason]',                example: '.nuke too toxic' },
      { name: 'note',          desc: 'Adds a private staff note to a user\'s record that only mods can see.',                                 aliases: 'addnote, staffnote',     parameters: 'user: @user note: <text>',               info: 'n/a', usage: '.note @user <text>',            example: '.note @Member keeps evading warnings' },
      { name: 'setperms',      desc: 'Sets view and send permissions for a specific role in a channel.',                                      aliases: 'perms, channelperms',    parameters: '#channel @role [view: true|false] [send: true|false]', info: 'n/a', usage: '.setperms #channel @role',  example: '.setperms #staff @Member view=false' },
      { name: 'createrole',    desc: 'Creates a new role in the server.',                                                                     aliases: 'cr',                     parameters: 'name: <name>',                           info: 'n/a', usage: '.createrole <name>',            example: '.createrole Regulars' },
      { name: 'deleterole',    desc: 'Deletes a role from the server permanently.',                                                           aliases: 'n/a',                    parameters: 'role: @role',                            info: 'n/a', usage: '.deleterole @role',             example: '.deleterole @TempRole' },
      { name: 'createchannel', desc: 'Creates a new text or voice channel in the server.',                                                    aliases: 'cc',                     parameters: 'name: <name> [type: text|voice]',        info: 'n/a', usage: '.createchannel <name>',         example: '.createchannel announcements' },
      { name: 'deletechannel', desc: 'Deletes a channel from the server permanently.',                                                        aliases: 'n/a',                    parameters: 'channel: #channel',                      info: 'n/a', usage: '.deletechannel #channel',       example: '.deletechannel #old-chat' },
      { name: 'clonechannel',  desc: 'Duplicates a channel along with all its permission overwrites.',                                        aliases: 'clone',                  parameters: '[channel: #channel]',                    info: 'n/a', usage: '.clonechannel [#channel]',      example: '.clonechannel #rules' },
    ],
  },
  security: {
    label: 'security', color: 0xFF6B35,
    cmds: [
      { name: 'antinuke',              desc: 'Manages all AntiNuke settings and configurations for the server.',                              aliases: 'an',                   parameters: 'n/a',                          info: 'n/a', usage: '.antinuke',                                  example: '.antinuke' },
      { name: 'antinuke enable',       desc: 'Turns on anti-nuke protection so the bot starts watching for nuke attempts.',                   aliases: 'an enable',            parameters: 'n/a',                          info: 'n/a', usage: '.antinuke enable',                           example: '.antinuke enable' },
      { name: 'antinuke disable',      desc: 'Turns off anti-nuke protection entirely.',                                                      aliases: 'an disable',           parameters: 'n/a',                          info: 'n/a', usage: '.antinuke disable',                          example: '.antinuke disable' },
      { name: 'antinuke status',       desc: 'Shows the current anti-nuke config including which modules are active and their thresholds.',   aliases: 'an status',            parameters: 'n/a',                          info: 'n/a', usage: '.antinuke status',                           example: '.antinuke status' },
      { name: 'antinuke whitelist',    desc: 'Adds or removes a trusted user from the anti-nuke whitelist so they won\'t get flagged.',       aliases: 'an whitelist',         parameters: 'add|remove @user',             info: 'n/a', usage: '.antinuke whitelist <add|remove> @user',     example: '.antinuke whitelist add @Admin' },
      { name: 'antinuke threshold',    desc: 'Sets how many actions of a certain type it takes to trigger the anti-nuke response.',           aliases: 'an threshold',         parameters: 'module: <name> count: <n>',    info: 'n/a', usage: '.antinuke threshold <module> <count>',       example: '.antinuke threshold ban 2' },
      { name: 'antinuke module',       desc: 'Toggles a specific anti-nuke detection module on or off.',                                      aliases: 'an module',            parameters: 'module: <name> state: on|off', info: 'n/a', usage: '.antinuke module <name> <on|off>',           example: '.antinuke module ban on' },
      { name: 'antinuke punish',       desc: 'Sets what punishment gets handed out when someone trips the nuke threshold.',                   aliases: 'an punish',            parameters: 'type: ban|kick|strip',         info: 'n/a', usage: '.antinuke punish <ban|kick|strip>',          example: '.antinuke punish ban' },
      { name: 'antinuke window',       desc: 'Sets the time window in seconds that the bot uses to count suspicious actions.',                aliases: 'an window',            parameters: 'seconds: <1-60>',              info: 'n/a', usage: '.antinuke window <seconds>',                 example: '.antinuke window 10' },
      { name: 'antinuke log',          desc: 'Sets which channel anti-nuke events get logged to.',                                            aliases: 'an log',               parameters: 'channel: #channel',            info: 'n/a', usage: '.antinuke log #channel',                     example: '.antinuke log #security-logs' },
      { name: 'automod',               desc: 'Manages the auto-moderation system — ban words, anti-spam, and more.',                          aliases: 'am',                   parameters: 'n/a',                          info: 'n/a', usage: '.automod',                                   example: '.automod status' },
      { name: 'automod enable',        desc: 'Turns on auto-moderation so the bot starts enforcing rules automatically.',                     aliases: 'am enable',            parameters: 'n/a',                          info: 'n/a', usage: '.automod enable',                            example: '.automod enable' },
      { name: 'automod disable',       desc: 'Turns off auto-moderation entirely.',                                                           aliases: 'am disable',           parameters: 'n/a',                          info: 'n/a', usage: '.automod disable',                           example: '.automod disable' },
      { name: 'automod status',        desc: 'Shows the current auto-mod settings including banned words and spam thresholds.',               aliases: 'am status',            parameters: 'n/a',                          info: 'n/a', usage: '.automod status',                            example: '.automod status' },
      { name: 'automod addword',       desc: 'Adds a word to the banned words list. Anyone who says it gets actioned automatically.',         aliases: 'am addword',           parameters: 'word: <text>',                 info: 'n/a', usage: '.automod addword <word>',                    example: '.automod addword slur' },
      { name: 'automod removeword',    desc: 'Removes a word from the banned words list.',                                                    aliases: 'am removeword',        parameters: 'word: <text>',                 info: 'n/a', usage: '.automod removeword <word>',                 example: '.automod removeword slur' },
      { name: 'automod antispam',      desc: 'Sets how many messages per 5 seconds triggers the spam filter.',                               aliases: 'am antispam',          parameters: 'messages: <number>',           info: 'n/a', usage: '.automod antispam <number>',                 example: '.automod antispam 5' },
    ],
  },
  roblox: {
    label: 'roblox', color: 0x00B4D8,
    cmds: [
      { name: 'verify',     desc: 'Links your Roblox account to your Discord account.',                              aliases: 'link, rverify',             parameters: 'username: <name>',    info: 'n/a',                               usage: '.verify <username>',      example: '.verify builderman' },
      { name: 'unverify',   desc: 'Unlinks your Roblox account from Discord.',                                       aliases: 'unlink',                    parameters: 'n/a',                 info: 'n/a',                               usage: '.unverify',               example: '.unverify' },
      { name: 'linked',     desc: 'Checks which Roblox account a Discord user is linked to.',                        aliases: 'rl',                        parameters: '[@user]',             info: 'n/a',                               usage: '.linked [@user]',         example: '.linked @FriendName' },
      { name: 'roblox',     desc: 'Looks up a Roblox user and shows their profile, avatar, and stats.',              aliases: 'rb, rblx, lookup',          parameters: 'username or id',      info: 'n/a',                               usage: '.roblox <username>',      example: '.roblox Roblox' },
      { name: 'groupcheck', desc: 'Lists every Roblox group a user is in along with their rank in each.',            aliases: 'gc, grouprank',             parameters: '[username or @user]', info: 'n/a',                               usage: '.gc [username]',          example: '.gc builderman' },
      { name: 'groupinfo',  desc: 'Shows detailed info about a Roblox group.',                                       aliases: 'group, gi',                 parameters: 'groupid: <id>',       info: 'n/a',                               usage: '.groupinfo <id>',         example: '.groupinfo 1234567' },
      { name: 'groupwall',  desc: 'Shows the most recent posts from a Roblox group\'s wall.',                        aliases: 'gwall',                     parameters: '[groupid: <id>]',     info: 'n/a',                               usage: '.groupwall [id]',         example: '.groupwall 1234567' },
      { name: 'tag',        desc: 'Applies a Roblox group tag to a user\'s nickname.',                               aliases: 't',                         parameters: 'username tag',        info: 'Tags: rockstar, Fraid, FaZe, dark, sharingan tag', usage: '.tag <username> <tag>', example: '.tag builderman rockstar' },
      { name: 'rank',       desc: 'Changes a Roblox user\'s rank in your linked group.',                             aliases: 'setrank',                   parameters: 'username rank',       info: 'Requires .setcookie first',         usage: '.rank <username> <rank>', example: '.rank builderman Officer' },
      { name: 'ranksync',   desc: 'Syncs Discord roles based on a user\'s Roblox group rank. You can map ranks to roles.',aliases: 'syncrank, robloxsync',  parameters: 'n/a',                 info: 'Use subcommands: add, remove, list, run', usage: '.ranksync',              example: '.ranksync list' },
      { name: 'ranksync add',    desc: 'Maps a Roblox rank to a Discord role so verified users get it automatically.', aliases: 'n/a',                   parameters: 'rank: <name|number> role: @role', info: 'n/a',                   usage: '.ranksync add <rank> @role',  example: '.ranksync add Officer @Officer' },
      { name: 'ranksync remove', desc: 'Removes a rank sync mapping from the list.',                                 aliases: 'n/a',                        parameters: 'role: @role',         info: 'n/a',                               usage: '.ranksync remove @role',  example: '.ranksync remove @Officer' },
      { name: 'ranksync list',   desc: 'Shows all current rank to role mappings.',                                   aliases: 'n/a',                        parameters: 'n/a',                 info: 'n/a',                               usage: '.ranksync list',          example: '.ranksync list' },
      { name: 'ranksync run',    desc: 'Manually syncs roles for all verified members right now.',                   aliases: 'n/a',                        parameters: 'n/a',                 info: 'n/a',                               usage: '.ranksync run',           example: '.ranksync run' },
      { name: 'setgroup',   desc: 'Links a Roblox group to this server so rank commands work.',                      aliases: 'linkgroup, sg',             parameters: 'groupid: <id>',       info: 'n/a',                               usage: '.setgroup <id>',          example: '.setgroup 1234567' },
      { name: 'shout',      desc: 'Updates your linked Roblox group\'s shout message.',                              aliases: 'n/a',                       parameters: 'message: <text>',     info: 'Requires cookie',                   usage: '.shout <message>',        example: '.shout Meeting in 30 min!' },
      { name: 'game',       desc: 'Looks up a Roblox game by its place ID and shows stats.',                         aliases: 'n/a',                       parameters: 'placeid: <id>',       info: 'n/a',                               usage: '.game <placeid>',         example: '.game 920587237' },
      { name: 'rap',        desc: 'Shows the total RAP (Recent Average Price) for a Roblox user\'s limiteds.',       aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.rap <username>',         example: '.rap builderman' },
      { name: 'badges',     desc: 'Lists all the badges a Roblox user has earned.',                                  aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.badges <username>',      example: '.badges Roblox' },
      { name: 'friends',    desc: 'Shows a Roblox user\'s friends list.',                                            aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.friends <username>',     example: '.friends builderman' },
      { name: 'outfit',     desc: 'Shows a preview of a Roblox user\'s current outfit.',                             aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.outfit <username>',      example: '.outfit Roblox' },
      { name: 'presence',   desc: 'Checks if a Roblox user is currently online and what they\'re doing.',            aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.presence <username>',    example: '.presence builderman' },
      { name: 'catalog',    desc: 'Searches the Roblox catalog for items matching your query.',                      aliases: 'n/a',                       parameters: 'query: <text>',       info: 'n/a',                               usage: '.catalog <query>',        example: '.catalog dragon sword' },
      { name: 'games',      desc: 'Lists all games created by a specific Roblox user.',                              aliases: 'n/a',                       parameters: 'username: <name>',    info: 'n/a',                               usage: '.games <username>',       example: '.games builderman' },
    ],
  },
  sniper: {
    label: 'sniper', color: 0x57F287,
    cmds: [
      { name: 'sniper',         desc: 'Manages your Roblox username sniping alerts for this server.',                aliases: 'sn',         parameters: 'n/a',                         info: 'n/a',                       usage: '.sniper',                    example: '.sniper list' },
      { name: 'sniper add',     desc: 'Starts tracking a Roblox user and alerts when they come online.',             aliases: 'sn add',     parameters: 'username [invite] [@role]',   info: 'Checks presence every 30s', usage: '.sniper add <username>',     example: '.sniper add builderman' },
      { name: 'sniper remove',  desc: 'Stops sniping a specific Roblox user.',                                       aliases: 'sn remove',  parameters: 'username: <name>',            info: 'n/a',                       usage: '.sniper remove <username>',  example: '.sniper remove builderman' },
      { name: 'sniper list',    desc: 'Shows all the Roblox users currently being sniped.',                          aliases: 'sn list',    parameters: 'n/a',                         info: 'n/a',                       usage: '.sniper list',               example: '.sniper list' },
      { name: 'sniper channel', desc: 'Changes which channel the sniper alerts get sent to for a specific user.',    aliases: 'sn channel', parameters: 'username: <name>',            info: 'n/a',                       usage: '.sniper channel <username>',  example: '.sniper channel builderman' },
    ],
  },
  giveaway: {
    label: 'giveaway', color: 0xFFD700,
    cmds: [
      { name: 'giveaway',        desc: 'Manages all giveaways for this server.',                                     aliases: 'gw',         parameters: 'n/a',                      info: 'n/a', usage: '.giveaway',                                example: '.giveaway list' },
      { name: 'giveaway start',  desc: 'Starts a new giveaway with a set duration, number of winners, and prize.',  aliases: 'gstart',     parameters: 'duration winners prize',   info: 'n/a', usage: '.giveaway start <time> <winners> <prize>', example: '.giveaway start 24h 1 Robux 1000' },
      { name: 'giveaway end',    desc: 'Ends a giveaway early and picks the winners right now.',                     aliases: 'gend',       parameters: 'message_id: <id>',         info: 'n/a', usage: '.giveaway end <message_id>',               example: '.giveaway end 123456789' },
      { name: 'giveaway reroll', desc: 'Picks a new winner if the original one didn\'t claim their prize.',         aliases: 'n/a',        parameters: 'message_id: <id>',         info: 'n/a', usage: '.giveaway reroll <message_id>',            example: '.giveaway reroll 123456789' },
      { name: 'giveaway list',   desc: 'Shows all currently active giveaways running in the server.',               aliases: 'glist',      parameters: 'n/a',                      info: 'n/a', usage: '.giveaway list',                           example: '.giveaway list' },
    ],
  },
  tickets: {
    label: 'tickets', color: 0x3498DB,
    cmds: [
      { name: 'setupticket',           desc: 'Sets up and manages the entire ticket system for the server.',         aliases: 'ticket, tickets', parameters: 'n/a',               info: 'n/a',                               usage: '.setupticket',                       example: '.setupticket status' },
      { name: 'setupticket staffrole', desc: 'Sets which role can use the staff buttons inside tickets.',           aliases: 'n/a',             parameters: 'role: @role',       info: 'Staff can Verify/Kick/Claim/Close', usage: '.setupticket staffrole @role',       example: '.setupticket staffrole @Staff' },
      { name: 'setupticket tag',       desc: 'Sends a tag request panel in a channel so users can open tag tickets.',aliases: 'n/a',            parameters: '[#channel]',        info: 'Opens in tag ticket category',      usage: '.setupticket tag [#channel]',        example: '.setupticket tag #get-tag' },
      { name: 'setupticket verify',    desc: 'Sends a verification panel in a channel for verify tickets.',         aliases: 'n/a',             parameters: '[#channel]',        info: 'Opens in verify ticket category',   usage: '.setupticket verify [#channel]',     example: '.setupticket verify #verify' },
      { name: 'wltagmanager',          desc: 'Manages who\'s allowed to use the tag command — add or remove users and roles.',aliases: 'wltag, tagwl', parameters: 'add|remove|list', info: 'Fully whitelisted users can accept tag requests', usage: '.wltagmanager <add|remove> @user', example: '.wltagmanager add @Staff' },
    ],
  },
  raidpoints: {
    label: 'raidpoints', color: 0xE74C3C,
    cmds: [
      { name: 'raidpoints',          desc: 'Manages the raid points system for this server.',                        aliases: 'rp',    parameters: 'n/a',               info: 'n/a',                                      usage: '.raidpoints',                         example: '.raidpoints top' },
      { name: 'raidpoints add',      desc: 'Adds raid points to a member\'s balance.',                              aliases: 'n/a',   parameters: '@user <amount>',     info: 'n/a',                                      usage: '.raidpoints add @user <amount>',      example: '.raidpoints add @Raider 25' },
      { name: 'raidpoints remove',   desc: 'Subtracts raid points from a member\'s balance.',                       aliases: 'n/a',   parameters: '@user <amount>',     info: 'n/a',                                      usage: '.raidpoints remove @user <amount>',   example: '.raidpoints remove @Member 10' },
      { name: 'raidpoints check',    desc: 'Checks how many raid points a specific user currently has.',            aliases: 'n/a',   parameters: '@user',              info: 'n/a',                                      usage: '.raidpoints check @user',             example: '.raidpoints check @Raider' },
      { name: 'raidpoints top',      desc: 'Shows the raid points leaderboard for the current season.',             aliases: 'n/a',   parameters: 'n/a',                info: 'n/a',                                      usage: '.raidpoints top',                     example: '.raidpoints top' },
      { name: 'raidpoints season',   desc: 'Views or changes the current raid season number.',                      aliases: 'n/a',   parameters: '[number: <n>]',      info: 'n/a',                                      usage: '.raidpoints season [number]',         example: '.raidpoints season 4' },
      { name: 'raidpoints reset',    desc: 'Resets all raid points for a specific user.',                           aliases: 'n/a',   parameters: '@user',              info: 'n/a',                                      usage: '.raidpoints reset @user',             example: '.raidpoints reset @Member' },
      { name: 'raidpoints transfer', desc: 'Converts a user\'s raid points into rank points, with an optional multiplier.', aliases: 'n/a', parameters: '@user [multiplier]', info: 'n/a',                               usage: '.raidpoints transfer @user [x]',      example: '.raidpoints transfer @Raider 2' },
      { name: 'raidpoints panel',    desc: 'Sends the raid leaderboard as a live panel in a channel.',              aliases: 'n/a',   parameters: '[#channel]',         info: 'n/a',                                      usage: '.raidpoints panel [#channel]',        example: '.raidpoints panel #leaderboard' },
      { name: 'setrank',             desc: 'Sets a raid points threshold that automatically gives a user a role when they hit it.', aliases: 'sr', parameters: '<role_id> <points>', info: 'Role is auto-removed if points drop below the threshold', usage: '.setrank <role_id> <points>', example: '.setrank 123456789012345678 50' },
      { name: 'setrank list',        desc: 'Shows all the auto-promo rank roles that have been configured.',        aliases: 'n/a',   parameters: 'n/a',                info: 'n/a',                                      usage: '.setrank list',                       example: '.setrank list' },
      { name: 'setrank remove',      desc: 'Removes a rank role threshold so it no longer auto-assigns.',           aliases: 'n/a',   parameters: '<role_id>',          info: 'n/a',                                      usage: '.setrank remove <role_id>',           example: '.setrank remove 123456789012345678' },
    ],
  },
  server: {
    label: 'server', color: 0x5865F2,
    cmds: [
      { name: 'serverinfo',  desc: 'Shows a full overview of the server — members, channels, roles, boost level, and more.', aliases: 'si, server',             parameters: 'n/a',           info: 'n/a', usage: '.serverinfo',          example: '.serverinfo' },
      { name: 'userinfo',    desc: 'Shows Discord info about a user — account age, roles, join date, and more.',             aliases: 'ui, whois, user',        parameters: '[@user]',       info: 'n/a', usage: '.userinfo [@user]',     example: '.userinfo @someone' },
      { name: 'avatar',      desc: 'Shows someone\'s avatar as a full-size image. Defaults to yourself if no user is given.',aliases: 'av, pfp, icon',          parameters: '[@user]',       info: 'n/a', usage: '.avatar [@user]',       example: '.avatar @someone' },
      { name: 'banner',      desc: 'Shows a user\'s banner image if they have one set.',                                     aliases: 'userbanner',             parameters: '[@user]',       info: 'n/a', usage: '.banner [@user]',       example: '.banner @someone' },
      { name: 'roleinfo',    desc: 'Shows detailed info about a role — color, permissions, member count, and more.',         aliases: 'ri, rinfo',              parameters: 'role: @role',   info: 'n/a', usage: '.roleinfo @role',        example: '.roleinfo @Admin' },
      { name: 'channelinfo', desc: 'Shows details about a channel — type, topic, slowmode, creation date, and more.',       aliases: 'ci, channel',            parameters: '[#channel]',    info: 'n/a', usage: '.channelinfo [#channel]', example: '.channelinfo #general' },
      { name: 'roles',       desc: 'Lists all roles in the server with their member count.',                                 aliases: 'rolelist, listroles',    parameters: 'n/a',           info: 'n/a', usage: '.roles',                example: '.roles' },
      { name: 'channels',    desc: 'Shows a breakdown of all channel types in the server.',                                  aliases: 'channellist, listchannels', parameters: 'n/a',        info: 'n/a', usage: '.channels',             example: '.channels' },
      { name: 'membercount', desc: 'Shows the total member count, split between humans and bots.',                          aliases: 'mc, count',              parameters: 'n/a',           info: 'n/a', usage: '.membercount',          example: '.membercount' },
      { name: 'boosters',    desc: 'Lists all the members who are currently boosting the server.',                          aliases: 'boosts, nitro',          parameters: 'n/a',           info: 'n/a', usage: '.boosters',             example: '.boosters' },
      { name: 'bots',        desc: 'Lists all the bots in the server.',                                                     aliases: 'botlist',                parameters: 'n/a',           info: 'n/a', usage: '.bots',                 example: '.bots' },
      { name: 'humans',      desc: 'Shows the count of human (non-bot) members in the server.',                             aliases: 'humanlist, members',     parameters: 'n/a',           info: 'n/a', usage: '.humans',               example: '.humans' },
      { name: 'invites',     desc: 'Lists all active invites in the server with their usage stats.',                        aliases: 'serverinvites, invitelist', parameters: 'n/a',        info: 'n/a', usage: '.invites',              example: '.invites' },
      { name: 'emoji',       desc: 'Lists all custom emojis in the server.',                                                aliases: 'emotes, emojis, emojilist', parameters: 'n/a',        info: 'n/a', usage: '.emoji',                example: '.emoji' },
    ],
  },
  misc: {
    label: 'misc', color: 0x99AAB5,
    cmds: [
      { name: 'ping',          desc: 'Checks the bot\'s latency and API response time.',                             aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.ping',               example: '.ping' },
      { name: 'botinfo',       desc: 'Shows stats about the bot — uptime, how many servers it\'s in, memory usage.', aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.botinfo',            example: '.botinfo' },
      { name: 'help',          desc: 'Browse all commands or look up a specific one.',                               aliases: 'h, cmds',      parameters: '[command]',       info: 'n/a',                       usage: '.help [command]',     example: '.help antinuke' },
      { name: 'setprefix',     desc: 'Changes the bot\'s command prefix for this server.',                           aliases: 'prefix',       parameters: 'prefix: <p>',     info: 'n/a',                       usage: '.setprefix <char>',   example: '.setprefix !' },
      { name: 'prefix',        desc: 'Changes the bot\'s command prefix for this server. Same as setprefix.',        aliases: 'setprefix',    parameters: 'prefix: <p>',     info: 'n/a',                       usage: '.prefix <char>',      example: '.prefix !' },
      { name: 'setcookie',     desc: 'Stores the Roblox .ROBLOSECURITY cookie needed for rank, tag, and shout commands.', aliases: 'n/a',   parameters: 'cookie: <c>',     info: 'Required for rank/tag/shout', usage: '.setcookie <cookie>', example: '.setcookie _|WARNING...' },
      { name: 'setlogs',       desc: 'Configures which channel server events get logged to.',                        aliases: 'n/a',          parameters: 'type #channel',   info: 'n/a',                       usage: '.setlogs <type> #ch', example: '.setlogs mod #mod-logs' },
      { name: 'alias',         desc: 'Manages custom command shortcuts so you can make your own command names.',     aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.alias add <a> <b>',  example: '.alias add kick .kick' },
      { name: 'autoresponder', desc: 'Manages auto-reply triggers — set the bot to automatically respond to certain messages.', aliases: 'ar', parameters: 'n/a',           info: 'n/a',                       usage: '.autoresponder',      example: '.autoresponder list' },
      { name: 'vanity',        desc: 'Monitors Discord vanity URLs and tracks activity around them.',                aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.vanity',             example: '.vanity add hollowk' },
      { name: 'striptag',      desc: 'Strips a Roblox tag from a user\'s nickname, resetting them back to Unverified/Member. Use "everyone" to strip all.', aliases: 'tagstrip, st', parameters: 'username or "everyone"', info: 'n/a', usage: '.striptag <username>',  example: '.striptag builderman' },
      { name: 'taglogset',     desc: 'Sets the channel where all tag activity gets logged.',                         aliases: 'taglog',       parameters: '#channel',        info: 'n/a',                       usage: '.taglogset #channel', example: '.taglogset #tag-logs' },
      { name: 'welcome',       desc: 'Configures the welcome message system — set the channel, message, and toggle it on or off.', aliases: 'welcomeset', parameters: 'n/a', info: 'Use subcommands: set, enable, disable, test', usage: '.welcome',          example: '.welcome set #welcome Hello {user}!' },
      { name: 'welcome set',   desc: 'Sets the welcome channel and message. Use {user} and {server} as placeholders.', aliases: 'n/a',       parameters: '#channel message',info: 'n/a',                       usage: '.welcome set #channel <message>', example: '.welcome set #welcome Welcome {user}!' },
      { name: 'welcome enable', desc: 'Turns the welcome message system on.',                                        aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.welcome enable',     example: '.welcome enable' },
      { name: 'welcome disable',desc: 'Turns the welcome message system off.',                                       aliases: 'n/a',          parameters: 'n/a',             info: 'n/a',                       usage: '.welcome disable',    example: '.welcome disable' },
      { name: 'welcome test',   desc: 'Sends a test welcome message so you can see what it looks like.',                                         aliases: 'n/a',       parameters: 'n/a',                     info: 'n/a', usage: '.welcome test',                         example: '.welcome test' },
      { name: 'settings',       desc: 'Shows all the current bot settings for this server in one place.',                                          aliases: 'config, cfg', parameters: 'n/a',                   info: 'n/a', usage: '.settings',                             example: '.settings' },
      { name: 'rankroles',      desc: 'Manages roles that get automatically given out when a user hits a certain rank points threshold.',           aliases: 'rankrole, rr', parameters: 'n/a',                  info: 'Use subcommands: add, remove, list', usage: '.rankroles',                    example: '.rankroles list' },
      { name: 'rankroles add',  desc: 'Adds a rank role reward — when someone hits the points threshold, they automatically get the role.',        aliases: 'n/a',       parameters: '<points> @role',          info: 'n/a', usage: '.rankroles add <points> @role',         example: '.rankroles add 100 @Elite' },
      { name: 'rankroles remove', desc: 'Removes a rank role reward from the list.',                                                               aliases: 'n/a',       parameters: '@role',                   info: 'n/a', usage: '.rankroles remove @role',               example: '.rankroles remove @Elite' },
      { name: 'rankroles list', desc: 'Shows all the rank role rewards that are currently set up.',                                                aliases: 'n/a',       parameters: 'n/a',                     info: 'n/a', usage: '.rankroles list',                       example: '.rankroles list' },
      { name: 'wl',             desc: 'Manages the bot whitelist — controls which users can access restricted commands and categories.',           aliases: 'whitelist', parameters: 'n/a',                     info: 'Use subcommands: add, remove, addrole, removerole, list', usage: '.wl',           example: '.wl list' },
      { name: 'wl add',         desc: 'Whitelists a user so they can use restricted commands. Leave category blank to whitelist for everything.',  aliases: 'n/a',       parameters: '@user [category]',        info: 'n/a', usage: '.wl add @user [category]',              example: '.wl add @Mod moderation' },
      { name: 'wl remove',      desc: 'Removes a user from the whitelist. Leave category blank to remove from all.',                              aliases: 'n/a',       parameters: '@user [category]',        info: 'n/a', usage: '.wl remove @user [category]',           example: '.wl remove @Mod' },
      { name: 'wlroles',        desc: 'Manages which roles are allowed to use the bot at all. Add, remove, or clear the role whitelist.',         aliases: 'wladd',     parameters: 'n/a',                     info: 'Use subcommands: add, remove, list, clear', usage: '.wlroles',          example: '.wlroles list' },
      { name: 'wlroles add',    desc: 'Allows a role to use the bot.',                                                                            aliases: 'n/a',       parameters: '@role',                   info: 'n/a', usage: '.wlroles add @role',                    example: '.wlroles add @Member' },
      { name: 'wlroles remove', desc: 'Removes a role from the whitelist so they can no longer use the bot.',                                     aliases: 'n/a',       parameters: '@role',                   info: 'n/a', usage: '.wlroles remove @role',                 example: '.wlroles remove @Member' },
      { name: 'wlroles list',   desc: 'Shows all the roles currently whitelisted to use the bot.',                                                aliases: 'n/a',       parameters: 'n/a',                     info: 'n/a', usage: '.wlroles list',                         example: '.wlroles list' },
      { name: 'wlroles clear',  desc: 'Clears the entire role whitelist — everyone will be able to use the bot again.',                           aliases: 'n/a',       parameters: 'n/a',                     info: 'n/a', usage: '.wlroles clear',                        example: '.wlroles clear' },
    ],
  },
};

// ─── Flat list (global pagination) ──────────────────────────────────────────
// Module order by default; deduplicated so 'sniper' only appears once

const _seen = new Set();
const ALL_CMDS = Object.entries(CATS).flatMap(([catKey, cat]) =>
  cat.cmds
    .filter(c => { if (_seen.has(c.name)) return false; _seen.add(c.name); return true; })
    .map(c => ({ ...c, catKey, catLabel: cat.label, catColor: cat.color }))
);

// Sorted copy (alphabetical) — built once
const ALL_CMDS_ALPHA = [...ALL_CMDS].sort((a, b) => a.name.localeCompare(b.name));

// Cache: messageId → { page, sortAlpha, authorId }
const helpCache = new Map();

// ─── Page builder ────────────────────────────────────────────────────────────

function buildPage(pageIdx, sortAlpha, prefix, requester) {
  const list  = sortAlpha ? ALL_CMDS_ALPHA : ALL_CMDS;
  const total = list.length;
  const page  = Math.max(0, Math.min(pageIdx, total - 1));
  const cmd   = list[page];
  const p     = prefix || '.';

  const usage   = cmd.usage.replace(/^\./, p);
  const example = cmd.example.replace(/^\./, p);

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setAuthor({
      name: requester.username || requester.tag || 'User',
      iconURL: requester.displayAvatarURL ? requester.displayAvatarURL({ dynamic: true }) : undefined,
    })
    .setTitle(cmd.name)
    .setDescription(`> ${cmd.desc}`)
    .addFields(
      { name: 'Aliases',     value: String(cmd.aliases || 'n/a'), inline: false },
      { name: 'Parameters',  value: String(cmd.parameters || 'n/a'), inline: false },
      { name: 'Information', value: String(cmd.info || 'n/a'), inline: false },
      { name: 'Usage',       value: `\`\`\`\nSyntax:   ${usage}\nExample:  ${example}\n\`\`\``, inline: false },
    )
    .setFooter({ text: `Page ${page + 1}/${total} (${total} entries) • Module: ${cmd.catLabel}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cmdhelp_prev')
      .setLabel('<')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('cmdhelp_next')
      .setLabel('>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= total - 1),
    new ButtonBuilder()
      .setCustomId('cmdhelp_sort')
      .setLabel('⇅')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('cmdhelp_close')
      .setLabel('✕')
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row], allowedMentions: { parse: [] } };
}

// ─── Find page index for a command name ─────────────────────────────────────

function findPage(name) {
  const lower = name.toLowerCase();
  const idx = ALL_CMDS.findIndex(c =>
    c.name === lower ||
    (typeof c.aliases === 'string' && c.aliases.split(/,\s*/).some(a => a === lower))
  );
  return idx >= 0 ? idx : 0;
}

// ─── Send / update a help message ───────────────────────────────────────────

async function openHelp(target, pageIdx, prefix) {
  const requester = target.author || target.user;
  const list      = ALL_CMDS;
  const page      = Math.max(0, Math.min(pageIdx, list.length - 1));
  const payload   = buildPage(page, false, prefix, requester);

  let msg;
  if (typeof target.deferReply === 'function') {
    msg = await target.editReply({ ...payload, fetchReply: true });
  } else {
    msg = await target.reply({ ...payload, fetchReply: true });
  }

  helpCache.set(msg.id, { page, sortAlpha: false, authorId: requester.id });
  setTimeout(() => helpCache.delete(msg.id), 5 * 60 * 1000);
  return msg;
}

module.exports = { CATS, ALL_CMDS, ALL_CMDS_ALPHA, helpCache, buildPage, findPage, openHelp };
