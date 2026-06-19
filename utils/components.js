'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

const CV2 = MessageFlags.IsComponentsV2;

const COLORS = {
  red:    0xED4245,
  green:  0x57F287,
  blue:   0x5865F2,
  yellow: 0xFEE75C,
  orange: 0xFF6B35,
  purple: 0x000000,
  pink:   0xEB459E,
  gold:   0xF1C40F,
  teal:   0x1ABC9C,
  white:  0xFFFFFF,
  black:  0x000000,
  gray:   0x99AAB5,
};

const S = (divider = true, size = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setSpacing(size).setDivider(divider);

const C = {
  container: (color) => new ContainerBuilder().setAccentColor(color ?? COLORS.blue),
  text:      (content) => new TextDisplayBuilder().setContent(content),
  sep:       (divider = true) => S(divider),
  thumbnail: (url) => new ThumbnailBuilder().setURL(url),
  section:   (textContent, thumbnail) => {
    const sec = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent));
    if (thumbnail) sec.setThumbnailAccessory(thumbnail);
    return sec;
  },
  button:    (label, style, opts = {}) => {
    const b = new ButtonBuilder().setLabel(label).setStyle(style);
    if (opts.customId) b.setCustomId(opts.customId);
    if (opts.url)      b.setURL(opts.url);
    if (opts.emoji)    b.setEmoji(opts.emoji);
    if (opts.disabled) b.setDisabled(true);
    return b;
  },
  row:       (...buttons) => new ActionRowBuilder().addComponents(...buttons),
};

function card({ title, desc, fields, color } = {}) {
  const container = C.container(color ?? COLORS.black);

  if (title) {
    container.addTextDisplayComponents(C.text(`## ${title}`));
    container.addSeparatorComponents(S());
  }

  if (desc) {
    container.addTextDisplayComponents(C.text(desc));
  }

  if (fields?.length) {
    const lines = fields.map(f => `**${f.name}** ${f.value}`).join('\n');
    container.addTextDisplayComponents(C.text(lines));
  }

  container.addSeparatorComponents(S(false));
  container.addTextDisplayComponents(C.text(`-# /fazee`));

  return { flags: CV2, components: [container] };
}

function ok(content) {
  const c = C.container(COLORS.green)
    .addTextDisplayComponents(C.text(`✅ ${content}`))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(C.text(`-# /fazee`));
  return { flags: CV2, components: [c] };
}

function err(content) {
  const c = C.container(COLORS.red)
    .addTextDisplayComponents(C.text(`❌ ${content}`))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(C.text(`-# /fazee`));
  return { flags: CV2, components: [c] };
}

function modCard({ action, user, mod, reason, extra = {} }) {
  let lines = [
    `## ${action}`,
    `**user** ${user} \`${user.id}\``,
    `**moderator** ${mod}`,
    `**reason** ${reason}`,
  ];

  for (const [k, v] of Object.entries(extra)) {
    lines.push(`**${k.toLowerCase()}** ${v}`);
  }

  const c = C.container(COLORS.orange)
    .addTextDisplayComponents(C.text(lines.join('\n')))
    .addSeparatorComponents(S(false))
    .addTextDisplayComponents(C.text(`-# /fazee`));

  return { flags: CV2, components: [c] };
}

function profileLinks(robloxId, rootPlaceId) {
  const buttons = [
    C.button('Roblox Profile', ButtonStyle.Link, { url: `https://www.roblox.com/users/${robloxId}/profile` }),
  ];
  if (rootPlaceId) {
    buttons.push(C.button('View Game', ButtonStyle.Link, { url: `https://www.roblox.com/games/${rootPlaceId}` }));
  }
  return C.row(...buttons);
}

module.exports = { CV2, COLORS, C, S, card, ok, err, modCard, profileLinks };
