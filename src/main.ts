import { MarkdownView, Plugin } from "obsidian";
import { draw_chessboard, ChessView } from "./view";
import { Settings, ChessPluginSettingTab, DEFAULT_SETTINGS } from "./settings";

export default class ChessPlugin extends Plugin {
	settings: Settings;
	private activeChessViews: Set<ChessView> = new Set();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChessPluginSettingTab(this.app, this));
		this.registerMarkdownCodeBlockProcessor(
			"chess",
			draw_chessboard(this.app, this.settings)
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
