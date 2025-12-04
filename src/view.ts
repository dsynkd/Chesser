import { nanoid } from "nanoid";
import {
	App,
	EditorPosition,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownView,
	Notice,
	parseYaml,
	stringifyYaml,
} from "obsidian";
import { Chess, Move, SQUARES } from "chess.js";
import { Chessground } from "chessground";
import { Api } from "chessground/api";
import { Color, Key } from "chessground/types";

import { Config, parseUserConfig } from "./config";
import { Settings } from "./settings";
import Sidebar from "./sidebar";

// To bundle all css files in styles.css with rollup
import "../assets/custom.css";
import "../node_modules/chessground/assets/chessground.base.css";
import "../node_modules/chessground/assets/chessground.brown.css";
// Piece styles
import "../assets/piece-css/alpha.css";
import "../assets/piece-css/california.css";
import "../assets/piece-css/cardinal.css";
import "../assets/piece-css/cburnett.css";
import "../assets/piece-css/chess7.css";
import "../assets/piece-css/chessnut.css";
import "../assets/piece-css/companion.css";
import "../assets/piece-css/dubrovny.css";
import "../assets/piece-css/fantasy.css";
import "../assets/piece-css/fresca.css";
import "../assets/piece-css/gioco.css";
import "../assets/piece-css/governor.css";
import "../assets/piece-css/horsey.css";
import "../assets/piece-css/icpieces.css";
import "../assets/piece-css/kosal.css";
import "../assets/piece-css/leipzig.css";
import "../assets/piece-css/letter.css";
import "../assets/piece-css/libra.css";
import "../assets/piece-css/maestro.css";
import "../assets/piece-css/merida.css";
import "../assets/piece-css/pirouetti.css";
import "../assets/piece-css/pixel.css";
import "../assets/piece-css/reillycraig.css";
import "../assets/piece-css/riohacha.css";
import "../assets/piece-css/shapes.css";
import "../assets/piece-css/spatial.css";
import "../assets/piece-css/staunty.css";
import "../assets/piece-css/tatiana.css";
// Board styles
import "../assets/board-css/brown.css";
import "../assets/board-css/blue.css";
import "../assets/board-css/green.css";
import "../assets/board-css/purple.css";
import "../assets/board-css/ic.css";

export class ChessView extends MarkdownRenderChild {
	private ctx: MarkdownPostProcessorContext;
	private app: App;
	private cg: Api;
	private chess: Chess;
	private sidebar: Sidebar;
	private moves: Move[];
	private config: Config;

	public currentMoveIdx: number;

	constructor(
		containerEl: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		config: Config,
		app: App
	) {
		super(containerEl);

		this.chess = new Chess();
		this.config = config;
		this.loadMoveList()

		this.moves = this.chess.history({ verbose: true });
		this.currentMoveIdx = config.currentMoveIdx ?? this.moves.length - 1;

		let lastMove: [Key, Key] = undefined;
		if (this.currentMoveIdx >= 0) {
			const move = this.moves[this.currentMoveIdx];
			lastMove = [move.from, move.to];
		}

		this.applyStyles(containerEl, config.pieceStyle, config.boardStyle);
		try {
			this.cg = Chessground(containerEl.createDiv(), {
				fen: this.chess.fen(),
				lastMove,
				orientation: config.orientation as Color,
				viewOnly: config.viewOnly,
				drawable: {
					enabled: config.drawable
				},
			});
		} catch (e) {
			new Notice("ChessView error: Invalid config");
			console.error(e);
			return;
		}
		this.applyCoordinates(config.enableCoordinates);
		this.applyInitialBoardWidth(config.boardWidth);
		this.setupSidebar()
		this.setupKeyboardShortcuts();
	}

	private loadMoveList() {
		if (this.config.pgn && this.config.fen) {
			const error = 'Both FEN and PGN detected.'
			console.warn(error);
			new Notice(`[ChessView] ${error}`);
			const errorEl = this.containerEl.createDiv("chesser-error");
			errorEl.textContent = `${error}`;
			return;
		} else if (this.config.pgn) {
			try {
				this.chess.loadPgn(this.config.pgn);
			} catch (error) {
				console.warn(error);
				new Notice(`[ChessView] ${error.message}`);
				const errorEl = this.containerEl.createDiv("chesser-error");
				errorEl.textContent = `${error.message}`;
				return;
			}
		} else if (this.config.fen) {
			this.chess.load(this.config.fen);
		} else {
			const error = "No FEN or PGN found.";
			console.warn(error);
			new Notice(`[ChessView] ${error}`);
			const errorEl = this.containerEl.createDiv("chesser-error");
			errorEl.textContent = `${error}`;
			return;
		}
	}

	private applyStyles(el: HTMLElement, pieceStyle: string, boardStyle: string) {
		el.addClasses([pieceStyle, `${boardStyle}-board`, "chess-view"]);
	}

	private setupSidebar() {
		if (this.config.showSidebar) {
			this.sidebar = new Sidebar(this.containerEl, this);
		} else {
			this.containerEl.addClass("no-menu");
		}
	}

	private setupKeyboardShortcuts() {
		this.containerEl.setAttribute("tabindex", "0");
		this.containerEl.style.outline = "none";

		this.containerEl.addEventListener("keydown", (e: KeyboardEvent) => {
			const activeElement = document.activeElement;
			const isFocused = activeElement === this.containerEl || 
			                  this.containerEl.contains(activeElement);
			
			if (isFocused && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
				e.preventDefault();
				e.stopPropagation();
				
				if (e.key === "ArrowLeft") {
					this.previousMove();
				} else if (e.key === "ArrowRight") {
					this.nextMove();
				}
			}
		});

		this.containerEl.addEventListener("click", (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target === this.containerEl || target.closest('.chess-view')) {
				this.containerEl.focus();
			}
		}, true); // Use capture phase to catch clicks early
	}

	private applyInitialBoardWidth(width: string) {
		const boardEl = this.containerEl.querySelector('.cg-wrap') as HTMLElement;
		boardEl.style.width = width;
	}

	private applyCoordinates(enableCoordinates?: boolean) {
		const boardEl = this.containerEl.querySelector('.cg-wrap') as HTMLElement;
		if (enableCoordinates === true) {
			boardEl?.addClass('chesser-show-coords');
		} else {
			boardEl?.removeClass('chesser-show-coords');
		}
	}

	public color_turn(): Color {
		return this.chess.turn() === "w" ? "white" : "black";
	}

	public dests(): Map<Key, Key[]> {
		const dests = new Map();
		SQUARES.forEach((s) => {
			const ms = this.chess.moves({ square: s, verbose: true });
			if (ms.length)
				dests.set(
					s,
					ms.map((m) => m.to)
				);
		});
		return dests;
	}

	public check(): boolean {
		return this.chess.inCheck();
	}

	public previousMove() {
		this.update_turn_idx(this.currentMoveIdx - 1);
	}

	public nextMove() {
		this.update_turn_idx(this.currentMoveIdx + 1);
	}

	public update_turn_idx(moveIdx: number): void {
		if (moveIdx < -1 || moveIdx >= this.moves.length) {
			return;
		}

		const isUndoing = moveIdx < this.currentMoveIdx;
		if (isUndoing) {
			while (this.currentMoveIdx > moveIdx) {
				this.currentMoveIdx--;
				this.chess.undo();
			}
		} else {
			while (this.currentMoveIdx < moveIdx) {
				this.currentMoveIdx++;
				const move = this.moves[this.currentMoveIdx];
				this.chess.move(move);
			}
		}

		let lastMove: [Key, Key] = undefined;
		if (this.currentMoveIdx >= 0) {
			const move = this.moves[this.currentMoveIdx];
			lastMove = [move.from, move.to];
		}

		this.cg.set({
			fen: this.chess.fen(),
			lastMove,
		});
	}

	public turn() {
		return this.chess.turn();
	}

	public history() {
		return this.moves;
	}

	public flipBoard() {
		return this.cg.toggleOrientation();
	}

	public getBoardState() {
		return this.cg.state;
	}

	public getFen() {
		return this.chess.fen();
	}

	public loadFen(fen: string, moves?: string[]): void {
		let lastMove: [Key, Key] = undefined;
		if (moves) {
			this.currentMoveIdx = -1;
			this.moves = [];
			this.chess.reset();

			moves.forEach((fullMove) => {
				fullMove.split(" ").forEach((halfMove) => {
					const move = this.chess.move(halfMove);
					this.moves.push(move);
					this.currentMoveIdx++;
				});
			});

			if (this.currentMoveIdx >= 0) {
				const move = this.moves[this.currentMoveIdx];
				lastMove = [move.from, move.to];
			}
		} else {
			this.chess.load(fen);
		}

		this.cg.set({ fen: this.chess.fen(), lastMove });
	}
}
