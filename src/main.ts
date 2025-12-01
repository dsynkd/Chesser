import { MarkdownView, Plugin } from "obsidian";
import { draw_chessboard } from "./Chesser";
import { Settings, ChesserSettingTab, DEFAULT_SETTINGS } from "./settings";

export default class ChesserPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChesserSettingTab(this.app, this));
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
