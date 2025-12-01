import { setIcon, Setting } from "obsidian";
import { Chesser } from "./Chesser";

export default class ChesserMenu {
	private chesser: Chesser;
	private menuContainer: HTMLElement;
	private movesListEl: HTMLElement;
	private toolbar: HTMLElement;
	private parentContainer: HTMLElement;

	constructor(parentEl: HTMLElement, chesser: Chesser) {
		this.chesser = chesser;
		this.parentContainer = parentEl;
		this.menuContainer = this.parentContainer.createDiv("chess-menu-container");
		this.movesListEl = this.menuContainer.createDiv("chess-menu-section");

		this.redrawMoveList();
		this.createToolbar();
		this.setupResizeObserver();
	}

	private createToolbar() {
		this.toolbar = this.menuContainer.createDiv("chess-toolbar-container");
		this.createUndoButton();
		this.createRedoButton();
		this.createFlipBoardButton();
		this.createResetButton();
		this.createHideMenuButton();
	}

	private createUndoButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Undo";
			setIcon(btn, "left-arrow");

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault();
				this.chesser.undo_move();
			});
		});
	}

	private createRedoButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Redo";
			setIcon(btn, "right-arrow");

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault();
				this.chesser.redo_move();
			});
		});
	}

	private createResetButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {
			
			btn.ariaLabel = "Reset";
			setIcon(btn, "restore-file-glyph");
			
			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault();
				while (this.chesser.currentMoveIdx >= 0) {
					this.chesser.undo_move();
				}
			});
		});
	}

	private createFlipBoardButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {
			
			btn.ariaLabel = "Flip board";
			setIcon(btn, "switch");

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault();
				this.chesser.flipBoard();
			});
		});
	}

	private createHideMenuButton() {
		this.toolbar.createEl("a", "view-action", (btn: HTMLAnchorElement) => {

			btn.ariaLabel = "Hide Menu";
			setIcon(btn, "x");

			btn.addEventListener("click", (e: MouseEvent) => {
				e.preventDefault();
				this.parentContainer.addClass('no-menu');
			});
		});
	}

	public redrawMoveList() {
		this.movesListEl.empty();
		this.movesListEl.createDiv({
			text: this.chesser.turn() === "b" ? "Black's turn" : "White's turn",
			cls: "chess-turn-text",
		});
		this.movesListEl.createDiv("chess-move-list", (moveListEl) => {
			this.chesser.history().forEach((move, idx) => {
				const moveEl = moveListEl.createDiv({
					cls: `chess-move ${
						this.chesser.currentMoveIdx === idx ? "chess-move-active" : ""
					}`,
					text: move.san,
				});
				moveEl.addEventListener("click", (ev) => {
					ev.preventDefault();
					this.chesser.update_turn_idx(idx);
				});
			});
		});
	}

	private setupResizeObserver() {
		const boardEl = this.parentContainer.querySelector('.cg-wrap');
		const resizeObserver = new ResizeObserver(entries => {
			const width = entries[0].contentRect.width;
			this.menuContainer.style.maxHeight = `${width}px`;
		});
		resizeObserver.observe(boardEl);
	}
}
