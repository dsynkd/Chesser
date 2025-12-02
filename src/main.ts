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
		
		this.addCommand({
			id: "chesser-toggle-sidebar",
			name: "Toggle Sidebar",
			callback: () => {
				if(document.activeElement.hasClass('chesser-container') == false) { return }
				if(document.activeElement.hasClass('no-menu')) {
					document.activeElement.removeClass('no-menu');
				} else {
					document.activeElement.addClass('no-menu');
				}
			},
			hotkeys: []
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
