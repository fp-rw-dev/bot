import Prisma from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import {
  container as cntr,
  LogLevel,
  SapphireClient,
} from "@sapphire/framework";
import * as Sentry from "@sentry/node";
import EventEmitter from "@foxify/events";
import { ModalSubmitInteraction } from "discord.js";
import rfs from "rotating-file-stream";
import {
  PREFIX,
  SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE,
} from "../config/main.js";
import { ConfigManager } from "./ConfigManager.js";
import type { Events } from "../types.js";
import { TapkiManager } from "./TapkiManager.js";

const { default: Emitter } = EventEmitter as unknown as {
  default: typeof EventEmitter;
};
const { PrismaClient: PrismaClient2 } = Prisma;

export class OperatorClient extends SapphireClient {
  public constructor() {
    super({
      caseInsensitiveCommands: true,
      caseInsensitivePrefixes: true,
      defaultPrefix: PREFIX,
      loadMessageCommandListeners: false,
      disableMentionPrefix: true,
      intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", "GUILD_MEMBERS"],
      logger: { level: LogLevel.Debug },
      allowedMentions: {
        parse: ["users"],
      },
    });
    cntr.prisma = new PrismaClient2();
    cntr.configManager = new ConfigManager(cntr.prisma);
    cntr.tapkiManager = new TapkiManager(cntr.prisma);
    cntr.tapkiTimestamps = new Map<string, number>();
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    });
    cntr.captureException = Sentry.captureException.bind(Sentry);
    cntr.events = new Emitter<Events>();
    cntr.internalEmitter = new Emitter<{
      modal: (modal: ModalSubmitInteraction) => void;
    }>();
    cntr.rotatingStreamMap = new Map();
    cntr.commandData = { config: {} };
  }

  public async login(token?: string): Promise<string> {
    await cntr.prisma.$connect();
    return super.login(token);
  }

  public async destroy(): Promise<void> {
    await cntr.prisma.$disconnect();
    return super.destroy();
  }

  // TODO: Customisable prefixes
  public fetchPrefix = async (): Promise<readonly string[]> => [
    PREFIX,
    "operator ",
    "op.",
    "op::",
    "operator::",
  ];
}

declare module "@sapphire/pieces" {
  interface Container {
    prisma: PrismaClient;
    configManager: ConfigManager;
    tapkiManager: TapkiManager;
    tapkiTimestamps: Map<string, number>;
    events: EventEmitter<Events>;
    internalEmitter: EventEmitter<{
      modal: (modal: ModalSubmitInteraction) => void;
    }>;
    captureException: (exception: any) => string;
    rotatingStreamMap: Map<string, rfs.RotatingFileStream>;
    commandData: Record<string, Record<string, any>>;
  }
}
