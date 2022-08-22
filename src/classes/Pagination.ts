import {
  PaginatedMessage,
  PaginatedMessagePage,
} from "@sapphire/discord.js-utilities";

export default class Pagination extends PaginatedMessage {
  constructor() {
    super();
    this.actions.delete("@sapphire/paginated-messages.goToPage");
  }
  
  addPage(page: PaginatedMessagePage) {
    this.pages.push(page);
    return this;
  }
}
