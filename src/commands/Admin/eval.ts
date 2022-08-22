import {
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandBooleanOption,
} from "@discordjs/builders";
import {
  ApplicationCommandRegistry,
  Command,
  PieceContext,
  RegisterBehavior,
} from "@sapphire/framework";
import { CommandInteraction } from "discord.js";
import { inspect } from "node:util";

export class EvalCommand extends Command {
  public constructor(context: PieceContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "eval",
      description: "A simple eval command. Bot owner only.",
      preconditions: ["OwnerOnly"],
      flags: ["hidden"],
    });
  }

  public chatInputRun(interaction: CommandInteraction): void {
    setImmediate(() => {
      try {
        const start = Date.now();
        const evalResult = inspect(
          // eslint-disable-next-line no-eval
          eval(interaction.options.getString("code", true)),
          false,
          0
        ).trim();
        interaction.reply({
          content:
            `> 🕒  Executed in ${Date.now() - start}ms. Result:\n` +
            "```js\n" +
            evalResult.slice(0, 1900) +
            "\n```",
          ephemeral: !!interaction.options.getBoolean("ephemeral"),
        });
      } catch (e) {
        interaction.reply({
          content:
            `> ⛔  Encountered an error!\n` +
            "```js\n" +
            inspect(e, false, 1).trim() +
            "\n```",
          ephemeral: !!interaction.options.getBoolean("ephemeral"),
        });
      }
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(
          new SlashCommandStringOption()
            .setName("code")
            .setDescription("Code to evaluate")
            .setRequired(true)
        )
        .addBooleanOption(
          new SlashCommandBooleanOption()
            .setName("ephemeral")
            .setDescription("yes?")
        )
        .toJSON() as any,
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
