import {
  SlashCommandBuilder,
  SlashCommandUserOption,
} from "@discordjs/builders";
import {
  ApplicationCommandRegistry,
  Command,
  PieceContext,
  RegisterBehavior,
} from "@sapphire/framework";
import { Util } from "discord.js";
import type { GuildInteraction } from "../../types.js";
// import { INFO } from "../../config/colors.js";

export class ResetWarnsCommand extends Command {
  public constructor(context: PieceContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "warns",
      aliases: ["warnings", "предупреждения"],
      generateDashLessAliases: true,
      preconditions: ["GuildOnly"],
      requiredUserPermissions: ["KICK_MEMBERS"],
      description: "Lists warnings for a user.",
    });
  }

  public async chatInputRun(interaction: GuildInteraction): Promise<void> {
    const emojiMappings = {
      1: "<:normal_warning:978034450384420896>",
      2: "<:strict_warning:978034450438979635>",
      3: "<:very_strict_warning:978034450598338560>",
    };

    const user = interaction.options.getUser("user") || interaction.user;

    const warnings = await this.container.prisma.warning.findMany({
      where: {
        guildId: interaction.guildId,
        userId: user.id,
      },
    });

    await interaction.reply(
      `**Warnings for ${Util.escapeMarkdown(user.username)}:**\n>>> ` +
        (warnings.length ? warnings
          .map(
            (w) =>
              `${emojiMappings[w.weight as 1 | 2 | 3]} #${
                w.id
              } — ${Util.escapeCodeBlock(
                Util.escapeInlineCode(w.reason || "N/A")
              )}`
          )
          .join("\n") : "None")
    );
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("User to list warnings for")
        ).toJSON() as any,
      {
        guildIds:
          process.env.NODE_ENV === "development"
            ? process.env.GUILD_IDS!.split(",")
            : [],
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }
}

