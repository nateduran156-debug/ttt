'use strict';

const { isWhitelisted, hasBotAccess } = require('../utils/whitelist');
const { getGiveaway, updateGiveaway } = require('../utils/database');
const { ok, err, CV2, COLORS, C }   = require('../utils/components');
const { OWNER_ID }                   = require('../utils/constants');
const {
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Global whitelist gate — silently ignore non-whitelisted users ────────
    if (interaction.guild && !hasBotAccess(interaction.member)) return;

    // ── Slash commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) return;

      const category = cmd.category || 'all';

      if (!isWhitelisted(interaction.member, category)) return;

      try {
        await cmd.execute(interaction, client);
      } catch (e) {
        console.error(`[InteractionCreate] Slash error in /${interaction.commandName}: ${e.message}`);
        const reply = { ...err(`An error occurred: ${e.message}`), ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          interaction.editReply(reply).catch(() => {});
        } else {
          interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    // ── Select menus ─────────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_tag_select') {
        const { handleTagSelect } = require('./ticketButton');
        try {
          await handleTagSelect(interaction, client);
        } catch (e) {
          console.error(`[TicketTagSelect] ${e.message}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ ...err(`An error occurred: ${e.message}`), ephemeral: true }).catch(() => {});
          }
        }
        return;
      }
    }

    // ── Modal submits ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      if (id.startsWith('ticket_modal_')) {
        const { handleModalSubmit } = require('./ticketButton');
        try {
          await handleModalSubmit(interaction, client);
        } catch (e) {
          console.error(`[Ticket Modal] ${e.message}`);
          const reply = { ...err(`An error occurred: ${e.message}`), ephemeral: true };
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply(reply).catch(() => {});
          } else {
            await interaction.reply(reply).catch(() => {});
          }
        }
        return;
      }

      // ── Setup modals ──────────────────────────────────────────────────────
      if (id.startsWith('setup_modal_')) {
        const {
          buildPanel, setPrefix: _setPrefix, setConfig: _setConfig, setVerifyConfig: _setVerifyConfig,
        } = require('../commands/setup');
        const { setPrefix, setConfig, setVerifyConfig, getPrefix } = require('../utils/database');

        // parse customId: setup_modal_TYPE:msgId:chanId
        const parts  = id.split(':');
        const type   = parts[0].replace('setup_modal_', '');
        const msgId  = parts[1];
        const chanId = parts[2];

        const guild  = interaction.guild;

        const refreshPanel = async () => {
          try {
            const chan = guild.channels.cache.get(chanId);
            if (!chan) return;
            const msg = await chan.messages.fetch(msgId).catch(() => null);
            if (!msg) return;
            const prefix = getPrefix(guild.id);
            await msg.edit(buildPanel(guild, prefix)).catch(() => {});
          } catch (_) { /* panel refresh is best-effort */ }
        };

        try {
          if (type === 'prefix') {
            const val = interaction.fields.getTextInputValue('prefix').trim();
            if (!val) return interaction.reply({ ...err('Prefix cannot be empty.'), ephemeral: true });
            setPrefix(guild.id, val);
            await interaction.reply({ ...ok(`Prefix updated to \`${val}\`.`), ephemeral: true });

          } else if (type === 'cookie') {
            const val = interaction.fields.getTextInputValue('cookie').trim();
            setConfig(guild.id, 'cookie', val);
            await interaction.reply({ ...ok('Cookie saved.'), ephemeral: true });

          } else if (type === 'roblox') {
            const val = interaction.fields.getTextInputValue('group_id').trim();
            if (!/^\d+$/.test(val)) return interaction.reply({ ...err('Group ID must be a number.'), ephemeral: true });
            setConfig(guild.id, 'roblox_group_id', val);
            await interaction.reply({ ...ok(`Roblox Group ID set to \`${val}\`.`), ephemeral: true });

          } else if (type === 'verifiedrole') {
            const val = interaction.fields.getTextInputValue('role_id').trim();
            const role = guild.roles.cache.get(val) || guild.roles.cache.find(r => r.name.toLowerCase() === val.toLowerCase());
            if (!role) return interaction.reply({ ...err(`Couldn't find a role with ID/name \`${val}\`.`), ephemeral: true });
            setVerifyConfig(guild.id, { verified_role: role.id });
            await interaction.reply({ ...ok(`Verified role set to <@&${role.id}>.`), ephemeral: true });
          }

          await refreshPanel();
        } catch (e) {
          console.error(`[Setup Modal ${type}] ${e.message}`);
          if (!interaction.replied && !interaction.deferred)
            await interaction.reply({ ...err(`Setup failed: ${e.message}`), ephemeral: true }).catch(() => {});
        }
        return;
      }
    }

    // ── Button interactions ──────────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      // ── Roles pagination ─────────────────────────────────────────────────────
      if (id === 'roles_prev' || id === 'roles_next' || id === 'roles_sort' || id === 'roles_close') {
        const { rolesCache, buildEmbed } = require('../commands/server/roles');
        const cached = rolesCache.get(interaction.message.id);

        if (id === 'roles_close') {
          rolesCache.delete(interaction.message.id);
          return interaction.message.delete().catch(() => interaction.deferUpdate().catch(() => {}));
        }

        if (!cached) return interaction.deferUpdate().catch(() => {});

        let { roles, page, sort, userId } = cached;

        if (id === 'roles_sort') {
          sort = sort === 'pos' ? 'alpha' : 'pos';
          page = 0;
        } else if (id === 'roles_prev') {
          page = Math.max(0, page - 1);
        } else if (id === 'roles_next') {
          const totalPages = Math.ceil(roles.length / 10) || 1;
          page = Math.min(totalPages - 1, page + 1);
        }

        rolesCache.set(interaction.message.id, { roles, page, sort, userId });
        const payload = buildEmbed(interaction.guild, roles, page, sort, interaction.user);
        return interaction.update(payload).catch(() => {});
      }

      // ── Giveaway ────────────────────────────────────────────────────────────
      if (id.startsWith('giveaway_enter_')) {
        const msgId   = id.replace('giveaway_enter_', '');
        const gw      = getGiveaway(msgId);
        if (!gw || gw.status !== 'active')
          return interaction.reply({ ...err('This giveaway has ended.'), ephemeral: true });

        const entries = JSON.parse(gw.entries || '[]');
        if (entries.includes(interaction.user.id)) {
          entries.splice(entries.indexOf(interaction.user.id), 1);
          updateGiveaway(gw.id, { entries: JSON.stringify(entries) });
          return interaction.reply({ ...ok(`You have left the **${gw.prize}** giveaway.`), ephemeral: true });
        }
        entries.push(interaction.user.id);
        updateGiveaway(gw.id, { entries: JSON.stringify(entries) });
        return interaction.reply({ ...ok(`Entered **${gw.prize}**! ${entries.length} total entr${entries.length === 1 ? 'y' : 'ies'}.`), ephemeral: true });
      }

      const { showTicketModal, handleStaffButton } = require('./ticketButton');

      // ── Ticket open buttons → show modal ────────────────────────────────────
      const ticketTypeMap = {
        'ticket_open':        'support',
        'ticket_open_tag':    'tag',
        'ticket_open_verify': 'verify',
      };
      if (ticketTypeMap[id] !== undefined) {
        try {
          await showTicketModal(interaction, ticketTypeMap[id]);
        } catch (e) {
          console.error(`[TicketButton] showModal failed: ${e.message}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ ...err(`Failed to open ticket: ${e.message}`), ephemeral: true }).catch(() => {});
          }
        }
        return;
      }

      // ── Group check pagination ◀▶ ────────────────────────────────────────────
      if (id.startsWith('ticket_gc_prev_') || id.startsWith('ticket_gc_next_')) {
        const { handleGcNav } = require('./ticketButton');
        try {
          await handleGcNav(interaction, client);
        } catch (e) {
          console.error(`[TicketGcNav] ${e.message}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ ...err(`An error occurred: ${e.message}`), ephemeral: true }).catch(() => {});
          }
        }
        return;
      }

      // ── Help pagination ◀ ▶ ⇅ ✕ ─────────────────────────────────────────────
      if (id === 'cmdhelp_prev' || id === 'cmdhelp_next' || id === 'cmdhelp_sort' || id === 'cmdhelp_close') {
        const { helpCache, buildPage } = require('../utils/cmdHelp');
        const { getPrefix } = require('../utils/database');
        const cached = helpCache.get(interaction.message.id);

        if (id === 'cmdhelp_close') {
          helpCache.delete(interaction.message.id);
          return interaction.message.delete().catch(() => interaction.deferUpdate().catch(() => {}));
        }

        if (!cached) return interaction.deferUpdate().catch(() => {});

        if (cached.authorId && interaction.user.id !== cached.authorId) {
          return interaction.reply({ content: 'This menu is not for you.', ephemeral: true });
        }

        const { ALL_CMDS, ALL_CMDS_ALPHA } = require('../utils/cmdHelp');
        let { page, sortAlpha, authorId } = cached;
        const total = sortAlpha ? ALL_CMDS_ALPHA.length : ALL_CMDS.length;

        if (id === 'cmdhelp_sort') { sortAlpha = !sortAlpha; page = 0; }
        else if (id === 'cmdhelp_prev') page = Math.max(0, page - 1);
        else if (id === 'cmdhelp_next') page = Math.min(total - 1, page + 1);

        const prefix = getPrefix(interaction.guild.id) || '.';
        const requester = interaction.user;
        const payload = buildPage(page, sortAlpha, prefix, requester);

        helpCache.set(interaction.message.id, { page, sortAlpha, authorId });
        return interaction.update(payload).catch(() => {});
      }

      // ── Setup panel buttons ───────────────────────────────────────────────────
      if (id.startsWith('setup_')) {
        const {
          buildPanel, setupCache,
          doSetupLogs, doSetupAntiNuke, doSetupAutoMod, doSetupWelcome, doSetupTickets,
          modalPrefix, modalCookie, modalRoblox, modalVerifiedRole,
        } = require('../commands/setup');
        const { getPrefix } = require('../utils/database');

        // Only the person who opened the panel can use it
        const cached = setupCache.get(interaction.message.id);
        if (cached && cached.authorId && interaction.user.id !== cached.authorId) {
          return interaction.reply({ content: 'This setup panel is not for you.', ephemeral: true });
        }

        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ ...err('You need **Manage Server** to use this.'), ephemeral: true });
        }

        const guild  = interaction.guild;
        const msgId  = interaction.message.id;
        const chanId = interaction.channelId;

        // Helper: defer + run + update panel
        const autoSetup = async (label, fn) => {
          await interaction.deferReply({ ephemeral: true });
          try {
            await fn(guild);
            const prefix = getPrefix(guild.id);
            await interaction.message.edit(buildPanel(guild, prefix)).catch(() => {});
            await interaction.editReply({ content: `✅ **${label}** configured successfully.` });
          } catch (e) {
            console.error(`[Setup ${label}] ${e.message}`);
            await interaction.editReply({ ...err(`Setup failed: ${e.message}`) });
          }
        };

        if (id === 'setup_close') {
          setupCache.delete(interaction.message.id);
          return interaction.message.delete().catch(() => interaction.deferUpdate().catch(() => {}));
        }

        if (id === 'setup_logs')     return autoSetup('Log Channels', doSetupLogs);
        if (id === 'setup_antinuke') return autoSetup('Anti-Nuke',    doSetupAntiNuke);
        if (id === 'setup_automod')  return autoSetup('Auto-Mod',     doSetupAutoMod);
        if (id === 'setup_welcome')  return autoSetup('Welcome',      doSetupWelcome);
        if (id === 'setup_tickets')  return autoSetup('Tickets',      doSetupTickets);

        // Modal-based setups
        if (id === 'setup_prefix')       return interaction.showModal(modalPrefix(msgId, chanId));
        if (id === 'setup_cookie')       return interaction.showModal(modalCookie(msgId, chanId));
        if (id === 'setup_roblox')       return interaction.showModal(modalRoblox(msgId, chanId));
        if (id === 'setup_verifiedrole') return interaction.showModal(modalVerifiedRole(msgId, chanId));

        return;
      }

      // ── Staff ticket buttons ─────────────────────────────────────────────────
      if (
        id === 'ticket_close' ||
        id === 'tag_req_deny' ||
        id.startsWith('ticket_verify_') ||
        id.startsWith('ticket_kick_') ||
        id.startsWith('tag_req_approve_')
      ) {
        try {
          await handleStaffButton(interaction, client);
        } catch (e) {
          console.error(`[TicketButton] staffButton failed: ${e.message}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ ...err(`An error occurred: ${e.message}`), ephemeral: true }).catch(() => {});
          }
        }
        return;
      }
    }
  },
};
