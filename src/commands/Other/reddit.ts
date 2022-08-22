import {
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "@discordjs/builders";
import {
  ApplicationCommandRegistry,
  Command,
  PieceContext,
  RegisterBehavior,
} from "@sapphire/framework";
import { MessageEmbed } from "discord.js";
import { decodeHTML5 } from "entities";
import Snoowrap from "snoowrap";
import Pagination from "../../classes/Pagination.js";
import { userError } from "../../formatting.js";
import { GuildInteraction } from "../../types.js";

export class RedditCommand extends Command {
  client: Snoowrap;

  public constructor(context: PieceContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "reddit",
      description: "/reddit yi.. oh",
      detailedDescription: "Get image posts from a subreddit",
    });
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET)
      this.unload();
    this.client = new Snoowrap({
      userAgent: "embed failed epically (Lynx#1632)",
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
    });
  }

  public async chatInputRun(i: GuildInteraction): Promise<void> {
    const subreddit = (await (this.client
      .getSubreddit(i.options.getString("subreddit", true))
      .fetch() as Promise<any>)) as Snoowrap.Subreddit;
    this.container.logger.debug("aaa");
    if (subreddit.over18 && !i.channel.nsfw) {
      i.reply({
        embeds: [
          userError(
            "Refusing to show a NSFW subreddit, move to a NSFW channel"
          ),
        ],
      });
      return;
    }
    i.deferReply();
    const posts = await subreddit.getNew({ limit: 50 });
    const pagination = new Pagination().setIdle(5 * 60 * 1000);
    for (const p of posts) {
      if (!p.url) continue;
      pagination.addPageEmbed(
        p.over_18 && !i.channel.nsfw
          ? userError("This post is NSFW. Not showing.")
          : new MessageEmbed()
              .setImage(p.url)
              .setTitle(p.title)
              .setURL("https://reddit.com" + p.permalink)
              .setDescription(decodeHTML5(p.selftext).trim())
              .setAuthor({
                name: "@" + p.author.name,
                url: `https://reddit.com/u/${p.author.name}`,
              })
      );
    }
    pagination.run(i);
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
            .setName("subreddit")
            .setDescription("subreddit name :O")
            .setRequired(true)
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
