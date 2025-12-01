import { BOARD_STYLES, PIECE_STYLES } from "./config";
import ChesserPlugin from "./main";

import { App, PluginSettingTab, Setting } from "obsidian";

export interface Settings {
	orientation: string;
	viewOnly: boolean;
	drawable: boolean;
	pieceStyle: string;
	boardStyle: string;
	enableSideMenu: boolean;
	statePersistence: boolean;
	boardWidth: string;
	enableCoordinates: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	orientation: "white",
	viewOnly: false,
	drawable: true,
	pieceStyle: "cburnett",
	boardStyle: "brown",
	enableSideMenu: true,
	statePersistence: true,
	boardWidth: "400px",
	enableCoordinates: true,
};

export class ChesserSettingTab extends PluginSettingTab {
	plugin: ChesserPlugin;

	constructor(app: App, plugin: ChesserPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("State Persistence")
			.setDesc("If enabled, chess boards will remember their state (moves, annotations) across sessions.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.statePersistence).onChange((statePersistence) => {
					this.plugin.settings.statePersistence = statePersistence;
					this.plugin.saveSettings();
				});
			});

		// Chessboard Section
		containerEl.createEl('h2', { text: 'Chessboard' });

		new Setting(containerEl)
			.setName("Piece Style")
			.setDesc("Sets the piece style.")
			.addDropdown((dropdown) => {
				let styles: Record<string, string> = {};
				PIECE_STYLES.map((style) => (styles[style] = style));
				dropdown.addOptions(styles);

				dropdown.setValue(this.plugin.settings.pieceStyle).onChange((pieceStyle) => {
					this.plugin.settings.pieceStyle = pieceStyle;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Board Style")
			.setDesc("Sets the board style.")
			.addDropdown((dropdown) => {
				let styles: Record<string, string> = {};
				BOARD_STYLES.map((style) => (styles[style] = style));
				dropdown.addOptions(styles);

				dropdown.setValue(this.plugin.settings.boardStyle).onChange((boardStyle) => {
					this.plugin.settings.boardStyle = boardStyle;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Board Width")
			.setDesc("Sets the default width of chess boards (e.g., '400px', '50%', '30em').")
			.addText((text) => {
				text.setValue(this.plugin.settings.boardWidth)
					.onChange((value) => {
						if (value.trim()) {
							this.plugin.settings.boardWidth = value.trim();
							this.plugin.saveSettings();
						}
					});
			});

		new Setting(containerEl)
			.setName("Orientation")
			.setDesc("Sets the default board orientation.")
			.addDropdown((dropdown) => {
				dropdown.addOption("white", "White");
				dropdown.addOption("black", "Black");

				dropdown.setValue(this.plugin.settings.orientation).onChange((orientation) => {
					this.plugin.settings.orientation = orientation;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Show Coordinates")
			.setDesc("Displays rank (1-8) and file (a-h) labels on the chessboard.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableCoordinates).onChange((enableCoordinates) => {
					this.plugin.settings.enableCoordinates = enableCoordinates;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Drawable")
			.setDesc("Controls the ability to draw annotations (arrows, circles) on the board.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.drawable).onChange((drawable) => {
					this.plugin.settings.drawable = drawable;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("View-only")
			.setDesc("If enabled, displays a static chess board (no moves, annotations, ...).")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.viewOnly).onChange((viewOnly) => {
					this.plugin.settings.viewOnly = viewOnly;
					this.plugin.saveSettings();
				});
			});

		// Side Menu Section
		containerEl.createEl('h2', { text: 'Side Menu' });

		new Setting(containerEl)
			.setName("Enable Side Menu")
			.setDesc("Shows the side menu with move history and controls.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableSideMenu).onChange((enableSideMenu) => {
					this.plugin.settings.enableSideMenu = enableSideMenu;
					this.plugin.saveSettings();
				});
			});
	}
}
