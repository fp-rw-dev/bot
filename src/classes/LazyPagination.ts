import {
  PaginatedMessagePage,
  LazyPaginatedMessage,
} from "@sapphire/discord.js-utilities";

export default class LazyPagination extends LazyPaginatedMessage {
  addPage(page: PaginatedMessagePage) {
    this.pages.push(page);
    return this;
  }
}
