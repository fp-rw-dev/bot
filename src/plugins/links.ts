import picomatch from "picomatch";
import type { PrismaClient } from "@prisma/client";
import { MappedObjectValidator, s } from "@sapphire/shapeshift";
import { container as cntr } from "@sapphire/framework";
import type { ExtendedMessage } from "../types.js";
import * as handlers from "../data/links/handlers.js";
import OperatorPlugin from "../classes/OperatorPlugin.js";

export default class LinksFilteringPlugin extends OperatorPlugin {
  public static readonly PLUGIN_NAME = "links";

  private readonly PLUGIN_NAME = "links";

  public static readonly DEFAULT_CONFIG = {
    cloudflare: undefined,
    fuzzy: undefined,
    safeBrowsing: undefined,
    quad9: undefined,
    yandex: undefined,
    spam404: undefined,
    custom: [],
  };

  public static readonly CONFIG_SCHEMA: MappedObjectValidator<any> = {
    cloudflare: s.boolean.optional,
    fuzzy: s.boolean.optional,
    safeBrowsing: s.boolean.optional,
    quad9: s.boolean.optional,
    yandex: s.boolean.optional,
    spam404: s.boolean.optional,
    custom: s.string.array,
  };

  private urlRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)/g;

  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  // mgetOption = mem(this.getOption.bind(this), {
  //   maxAge: 3000,
  //   cacheKey: (arguments_) => arguments_.slice(1).join(","),
  // });

  async messageCreate(message: ExtendedMessage): Promise<void> {
    const urls = (message.content + "\n" + message.ocrResult).match(
      this.urlRegex
    );
    if (!urls) return; // No URLs detected, nothing to do

    const config = await cntr.configManager.getConfig(message.guildId);

    const gopt = (opt: string) => config[`${this.PLUGIN_NAME}.${opt}`];

    const enabledProviders = [
      "quad9",
      "fuzzy",
      "yandex",
      "spam404",
      "cloudflare",
      "safeBrowsing",
    ].filter(gopt);

    const results = await Promise.all(
      urls.map((url) =>
        Promise.all(
          Object.values(handlers)
            .filter((h) => enabledProviders.includes(h.name))
            .map(async (v) => ({
              provider: v.name as keyof typeof handlers,
              result: await v(new URL(url)),
              url,
            }))
        )
      )
    );
    // const results = [{ result: true, provider: "cloudflare" }];
    if (
      results.flat(2).some((r) => !r.result) ||
      picomatch.isMatch(
        message.content + "\n" + message.ocrResult,
        gopt("custom") as string[]
      )
    ) {
      cntr.events.emit("linkProtectionTriggered", {
        guild: message.guild,
        matches: results
          .flat(2)
          .filter((r) => !r.result)
          .map((r) => ({ url: r.url, provider: r.provider })),
        message,
      });
    }
  }

  messageUpdate(
    _oldMessage: ExtendedMessage,
    message: ExtendedMessage
  ): Promise<void> {
    return this.messageCreate(message);
  }
}
