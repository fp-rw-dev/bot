import { container as cntr } from "@sapphire/framework";

interface WarnOptions {
  guildId: string;
  userId: string;
  moderatorId?: string;
  reason?: string;
  weight: 1 | 2 | 3;
}

interface RemoveWarnOptions {
  moderatorId?: string;
  warningId: number;
  reason?: string;
}

interface ResetWarnsOptions {
  moderatorId?: string;
  guildId: string;
  userId: string;
  reason?: string;
}

export async function warnMember(opts: WarnOptions) {
  const guild = await cntr.client.guilds.fetch(opts.guildId);
  const warning = await cntr.prisma.warning.create({
    data: opts,
  });
  cntr.events.emit("warningCreated", {
    warningId: warning.id,
    reason: opts.reason,
    member:
      (await guild.members.fetch(opts.userId)) ||
      (await cntr.client.users.fetch(opts.userId)),
    moderator: opts.moderatorId
      ? await guild.members.fetch(opts.moderatorId)
      : undefined,
    guild,
  });
  return warning;
}

export async function removeWarn(opts: RemoveWarnOptions) {
  const warning = await cntr.prisma.warning.delete({
    where: { id: opts.warningId },
  });
  const guild = await cntr.client.guilds.fetch(warning.guildId);
  cntr.events.emit("warningRemoved", {
    guild,
    reason: opts.reason,
    warningId: opts.warningId,
    moderator: opts.moderatorId
      ? await guild.members.fetch(opts.moderatorId)
      : undefined,
    member:
      (await guild.members.fetch(warning.userId)) ||
      (await cntr.client.users.fetch(warning.userId)),
  });
  return warning;
}

export async function resetWarns(opts: ResetWarnsOptions) {
  const guild = await cntr.client.guilds.fetch(opts.guildId);
  const target =
    (await guild.members.fetch(opts.userId)) ||
    (await cntr.client.users.fetch(opts.userId));
  const ids = (
    await cntr.prisma.warning.findMany({
      where: { userId: opts.userId, guildId: opts.guildId },
    })
  ).map((el) => el.id);

  cntr.events.emit("warningsReset", {
    guild,
    reason: opts.reason,
    moderator: opts.moderatorId
      ? await guild.members.fetch(opts.moderatorId)
      : undefined,
    member: target,
    warningIds: ids,
  });

  await cntr.prisma.warning.deleteMany({
    where: { userId: opts.userId, guildId: opts.guildId },
  });
  return ids;
}
