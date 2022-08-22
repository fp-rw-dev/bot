import {
  SlashCommandBuilder,
  SlashCommandNumberOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders";
import {
  ApplicationCommandRegistry,
  Command,
  PieceContext,
  RegisterBehavior,
} from "@sapphire/framework";
import parseColor from "color-parse";
// import parseColor from "color-parse";
import { MessageAttachment, MessageEmbed, Util } from "discord.js";
import phin from "phin";
import { userError } from "../../formatting.js";
import { GuildInteraction } from "../../types.js";

export class CanvasCommand extends Command {
  public constructor(context: PieceContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "canvas",
      description: "pixlbot reference???? draw on a canvas",
    });
  }

  public async chatInputRun(i: GuildInteraction): Promise<void> {
    // FIXME: Fix crash
    i.reply({ content: "Under construction", ephemeral: true });
    return;

    switch (i.options.getSubcommand()) {
      case "view": {
        i.reply({
          embeds: [
            new MessageEmbed()
              .setTitle("Canvas, enjoy")
              .setFooter({
                text: "Powered by https://v.gd/IkPrO8",
                iconURL:
                  "https://cdn.discordapp.com/emojis/876029041365352508.png?size=96",
              })
              .setImage("attachment://canvas.png"),
          ],
          files: [
            new MessageAttachment(
              (await phin("http://canvas:1323/")).body,
              "canvas.png"
            ),
          ],
        });
        break;
      }

      case "place": {
        if (
          i.options.getNumber("x", true) < 0 ||
          i.options.getNumber("x", true) > 80 ||
          i.options.getNumber("y", true) < 0 ||
          i.options.getNumber("y", true) > 80
        ) {
          i.reply({
            embeds: [userError("X and Y should be in range [0, 80]")],
          });
          return;
        }
        const color = parseColor(i.options.getString("color", true))?.values;
        if (!color) {
          i.reply({
            embeds: [
              userError(
                `Color ${Util.escapeMarkdown(
                  i.options.getString("color", true)
                )} couldn't be parsed!`
              ),
            ],
          });
          return;
        }
        const res = await phin({
          url: "http://canvas:1323/place",
          method: "PUT",
          data: {
            x: i.options.getNumber("x", true),
            y: i.options.getNumber("y", true),
            c: color,
          },
        });
        if (res.statusCode === 200) {
          i.reply("💤 Successfully placed pixel, enjoy");
        } else {
          throw new Error("Got status code: " + res.statusCode);
        }
        break;
      }

      default: {
        await i.reply({
          content:
            ":warning: This subcommand is not yet implemented! " +
            `Report this to <@723971496107573328> if the problem lasts for a long time.`,
          ephemeral: true,
        });
      }
    }
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("view")
            .setDescription("View the canvas wtf")
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("place")
            .setDescription("Place a pixel wtf??")
            .addNumberOption(
              new SlashCommandNumberOption()
                .setName("x")
                .setDescription("From 0 to 80")
                .setRequired(true)
            )
            .addNumberOption(
              new SlashCommandNumberOption()
                .setName("y")
                .setDescription("From 0 to 80")
                .setRequired(true)
            )
            .addStringOption(
              new SlashCommandStringOption()
                .setName("color")
                .setDescription("See https://npm.im/color-parse")
                .setRequired(true)
            )
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
