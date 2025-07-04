import { MarkdownView, Plugin } from "obsidian";
import { draw_chessboard_fen, draw_chessboard_pgn } from "./Chesser";
import { ChesserSettings, ChesserSettingTab, DEFAULT_SETTINGS } from "./ChesserSettings";

export default class ChesserPlugin extends Plugin {
  settings: ChesserSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ChesserSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor(
      "chess-fen",
      draw_chessboard_fen(this.app, this.settings)
    );
    this.registerMarkdownCodeBlockProcessor(
      "chess-pgn",
      draw_chessboard_pgn(this.app, this.settings)
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
