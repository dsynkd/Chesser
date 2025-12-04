import { App, MarkdownPostProcessorContext, MarkdownView, Plugin } from "obsidian";
import { ChessView } from "./view";
import { Settings, ChessPluginSettingTab, DEFAULT_SETTINGS } from "./settings";
import { Config, parseUserConfig } from "./config";

export default class ChessPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChessPluginSettingTab(this.app, this));

		// MARK: Register Codeblock Processors
		this.registerMarkdownCodeBlockProcessor(
			"chess",
			this.drawChessboard(this.app, this.settings)
		);
		this.registerMarkdownCodeBlockProcessor(
			"chess-pgn",
			this.drawPGNChessboard(this.app, this.settings)
		);
		this.registerMarkdownCodeBlockProcessor(
			"chess-fen",
			this.drawFENChessboard(this.app, this.settings)
		);
		
		// MARK: Register Commands
		this.addCommand({
			id: "chesser-toggle-sidebar",
			name: "Toggle Sidebar",
			callback: () => {
				// Only execute if the current active container is a Chess View
				if(document.activeElement.hasClass('chess-view') === false) {
					return
				}

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

	private drawChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const config = parseUserConfig(settings, source);
			if(!config) {
				const errorMessage = 'Could not parse user config.';
				console.warn(`[ChessPlugin] ${errorMessage}`);
				const errorEl = el.createDiv("chesser-error");
				errorEl.textContent = errorMessage;
				return;
			}
			ctx.addChild(new ChessView(el, ctx, config, app));
		};
	}

	private drawPGNChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const config: Config = {
				...settings,
				fen: "",
				pgn: source.trim(),
			}; 
			ctx.addChild(new ChessView(el, ctx, config, app));
		};
	}

	private drawFENChessboard(app: App, settings: Settings) {
		return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			let config: Config = {
				...settings,
				fen: source.trim()
			}; 
			ctx.addChild(new ChessView(el, ctx, config, app));
		};
	}
}
