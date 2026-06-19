import { sendLog } from '../utils/logger.js';

export const name = 'guildMemberUpdate';

export async function execute(oldMember, newMember) {
  const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

  if (added.size > 0) {
    await sendLog(newMember.guild, 'roles', {
      color: 0x57F287,
      content: `🎭 **role added** — ${newMember.user}: ${added.map(r => `<@&${r.id}>`).join(' ')}`,
    });
  }

  if (removed.size > 0) {
    await sendLog(newMember.guild, 'roles', {
      color: 0xED4245,
      content: `🎭 **role removed** — ${newMember.user}: ${removed.map(r => `<@&${r.id}>`).join(' ')}`,
    });
  }
}
