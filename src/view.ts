import {
	App,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Notice,
} from "obsidian";
import { Chess, Move, SQUARES } from "chess.js";
import { Chessground } from "chessground";
import { Api } from "chessground/api";
import { Color, Key } from "chessground/types";

import { Config } from "./config";
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

	public currentMoveIndex: number;

	constructor(
		containerEl: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		config: Config,
		app: App
	) {
		super(containerEl);

		this.app = app
		this.ctx = ctx
		this.chess = new Chess();
		this.config = config;
		
		if(!this.loadMoveList()) { return }

		this.moves = this.chess.history({ verbose: true });
		this.currentMoveIndex = config.currentMoveIndex ?? this.moves.length - 1;

		let lastMove: [Key, Key] = undefined;
		if (this.currentMoveIndex >= 0) {
			const move = this.moves[this.currentMoveIndex];
			lastMove = [move.from, move.to];
		}

		this.applyStyles();
		this.setupChessground(lastMove);
		this.applyCoordinates();
		this.applyInitialBoardWidth(config.boardWidth);
		this.setupSidebar()
		this.setupKeyboardShortcuts();
	}

	private loadMoveList() {
		if (this.config.pgn && this.config.fen) {
			this.presentError("Both FEN and PGN detected.");
			return false;
		}
		else if (this.config.pgn) {
			try {
				this.chess.loadPgn(this.config.pgn);
			} catch (error) {
				this.presentError(error.message);
				return false;
			}
		}
		else if (this.config.fen) {
			try {
				this.chess.load(this.config.fen);
			} catch (error) {
				this.presentError(error.message);
				return false;
			}
		}
		else {
			this.presentError("No FEN or PGN found.");
			return false;
		}
		return true;
	}

	private setupChessground(lastMove: [Key, Key]) {
		this.cg = Chessground(this.containerEl.createDiv(), {
			fen: this.chess.fen(),
			lastMove,
			orientation: this.config.orientation as Color,
			viewOnly: this.config.viewOnly,
			drawable: {
				enabled: this.config.drawable
			},
			events: {
				move: (orig: any, dest: any) => {
					const move = this.chess.move({ from: orig, to: dest });
					this.currentMoveIndex++;
					this.moves = [...this.moves.slice(0, this.currentMoveIndex), move];
					this.syncChessground();
				},
			}
		});
	}

	private applyStyles() {
		this.containerEl.addClasses([
			this.config.pieceStyle,
			`${this.config.boardStyle}-board`, "chess-view"]
		);
	}

	private setupSidebar() {
		if (this.config.showSidebar) {
			this.sidebar = new Sidebar(this.containerEl, this);
		} else {
			this.containerEl.addClass("no-menu");
		}
	}

	private applyInitialBoardWidth(width: string) {
		const boardEl = this.containerEl.querySelector('.cg-wrap') as HTMLElement;
		boardEl.style.width = width;
	}

	private applyCoordinates() {
		const boardEl = this.containerEl.querySelector('.cg-wrap') as HTMLElement;
		if (this.config.enableCoordinates === true) {
			boardEl?.addClass('chesser-show-coords');
		} else {
			boardEl?.removeClass('chesser-show-coords');
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

	private syncChessground() {
		this.cg.set({
			check: this.chess.inCheck(),
			turnColor: this.getTurnColor(),
			movable: {
				free: false,
				color: this.getTurnColor(),
				dests: this.getPossibleMoves(),
			},
		});

		if (this.sidebar) {
			this.sidebar.redrawMoveList();
		}
	}

	public getPossibleMoves(): Map<Key, Key[]> {
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

	public setMoveIndex(moveIndex: number): void {
		if (moveIndex < -1 || moveIndex >= this.moves.length) {
			return;
		}

		const isUndoing = moveIndex < this.currentMoveIndex;
		if (isUndoing) {
			while (this.currentMoveIndex > moveIndex) {
				this.currentMoveIndex--;
				this.chess.undo();
			}
		} else {
			while (this.currentMoveIndex < moveIndex) {
				this.currentMoveIndex++;
				const move = this.moves[this.currentMoveIndex];
				this.chess.move(move);
			}
		}

		let lastMove: [Key, Key] = undefined;
		if (this.currentMoveIndex >= 0) {
			const move = this.moves[this.currentMoveIndex];
			lastMove = [move.from, move.to];
		}

		this.cg.set({
			fen: this.chess.fen(),
			lastMove,
		});
		this.syncChessground();
	}

	public getTurnColor(): Color {
		return this.chess.turn() === "w" ? "white" : "black";
	}

	public previousMove() {
		this.setMoveIndex(this.currentMoveIndex - 1);
	}

	public nextMove() {
		this.setMoveIndex(this.currentMoveIndex + 1);
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

	private presentError(errorMessage: string, printToConsole: boolean = false, showNotice: boolean = false) {
		if(printToConsole) {
			console.warn(errorMessage)
		}
		if(showNotice) {
			new Notice(`[ChessPlugin] ${errorMessage}`);
		}
		const errorEl = this.containerEl.createDiv("chesser-error");
		errorEl.textContent = `${errorMessage}`;
	}
}
