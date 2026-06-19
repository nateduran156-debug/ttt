import { AuditLogEvent } from 'discord.js';
import { sendLog } from '../utils/logger.js';

export const name = 'guildAuditLogEntryCreate';

const HANDLED = new Set([
  AuditLogEvent.MemberBan,
  AuditLogEvent.MemberUnban,
  AuditLogEvent.MemberKick,
  AuditLogEvent.MemberUpdate,
]);

export async function execute(entry, guild) {
  if (!HANDLED.has(entry.action)) return;
  if (entry.executor?.bot) return;

  const mod = entry.executor ? `<@${entry.executor.id}>` : '*unknown*';
  const target = entry.target ? `<@${entry.target.id}>` : '*unknown*';
  const reason = entry.reason || 'no reason provided';

  let content;
  let color;

  if (entry.action === AuditLogEvent.MemberBan) {
    color = 0xED4245;
    content = `🔨 **banned** — ${target}\nmod · ${mod}\nreason · ${reason}`;
  } else if (entry.action === AuditLogEvent.MemberUnban) {
    color = 0x57F287;
    content = `✅ **unbanned** — ${target}\nmod · ${mod}\nreason · ${reason}`;
  } else if (entry.action === AuditLogEvent.MemberKick) {
    color = 0xFF6B35;
    content = `👢 **kicked** — ${target}\nmod · ${mod}\nreason · ${reason}`;
  } else if (entry.action === AuditLogEvent.MemberUpdate) {
    const timeoutChange = entry.changes?.find(c => c.key === 'communication_disabled_until');
    if (!timeoutChange) return;
    const timedOut = !!timeoutChange.new;
    color = timedOut ? 0xFF6B35 : 0x57F287;
    const until = timedOut ? `<t:${Math.floor(new Date(timeoutChange.new).getTime() / 1000)}:R>` : '';
    content = timedOut
      ? `⏱️ **timed out** — ${target} until ${until}\nmod · ${mod}\nreason · ${reason}`
      : `🔔 **timeout removed** — ${target}\nmod · ${mod}`;
  }

  if (content) {
    await sendLog(guild, 'mod', { color, content });
  }
}
