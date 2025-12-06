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

import { presentError } from "./main";
import { Config } from "./config";
import { 
	sanRegex,
	annotationRegex,
	MoveAnnotation,
	getAnnotationIcon,
	getAnnotationClass,
	getAnnotationTooltip,
} from "./annotations";
import Sidebar from "./sidebar";
import "./styles";


export type AnnotatedMove = Move & {
	annotation?: MoveAnnotation;
};

export class ChessView extends MarkdownRenderChild {
	private ctx: MarkdownPostProcessorContext;
	private app: App;
	private cg: Api;
	private chess: Chess;
	private sidebar: Sidebar;
	private moves: AnnotatedMove[];
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

		this.setupChessground();
		this.applyCoordinates();
		this.applyStyles();
		this.setupSidebar()
		this.setupKeyboardShortcuts();
	}

	public loadMoveList() {
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

		const moves = this.chess.history({ verbose: true });
		if (this.config.pgn) {
			this.moves = this.parseAnnotations(moves, this.config.pgn);
		} else {
			this.moves = moves.map(move => ({ ...move, annotation: null } as AnnotatedMove));
		}
		
		this.currentMoveIndex = this.moves.length - 1;
		return true;
	}

	private parseAnnotations(moves: Move[], pgn: string): AnnotatedMove[] {
		const matches = pgn.matchAll(sanRegex)
		const matchesArray = [...matches]
		const moveAnnotations = Array(matchesArray.length).fill(null)
		
		matchesArray.forEach((match, index) => {
			const annotationIndex = match.index + match[0].length
			const annotationMatch = pgn.slice(annotationIndex, annotationIndex+2).match(annotationRegex);
			if(annotationMatch) {
				moveAnnotations[index] = annotationMatch[0]
			}
		});

		return moves.map((move, index) => {
			return { ...move, annotation: moveAnnotations[index] } as AnnotatedMove;
		});
	}

	private setupChessground() {
		let lastMove: [Key, Key] = undefined;
		if (this.currentMoveIndex >= 0) {
			const move = this.moves[this.currentMoveIndex];
			lastMove = [move.from, move.to];
		}
		this.cg = Chessground(this.containerEl.createDiv(), {
			fen: this.chess.fen(),
			lastMove,
			orientation: this.config.orientation as Color,
			viewOnly: this.config.viewOnly,
			drawable: {
				enabled: true
			},
			events: {
				move: (orig: any, dest: any) => {
					const move = this.chess.move({ from: orig, to: dest });
					this.currentMoveIndex++;
					this.moves = [...this.moves.slice(0, this.currentMoveIndex), { ...move, annotation: null as MoveAnnotation } as AnnotatedMove];
					this.syncBoard();
				},
			}
		});

		if(this.config.startingMoveIndex != null) {
			this.setMoveIndex(this.config.startingMoveIndex - 1);
		}

		setTimeout(() => { this.updateBoardAnnotations() }, 50);
	}

	private applyStyles() {
		this.containerEl.addClasses([
			this.config.pieceStyle,
			`${this.config.boardStyle}-board`, "chess-view"]
		);
		if(this.config.centerBoard) {
			this.containerEl.addClass('center-board')
		}
	}

	private setupSidebar() {
		if (this.config.showSidebar) {
			this.sidebar = new Sidebar(this.containerEl, this);
		} else {
			this.containerEl.addClass("no-menu");
		}
	}

	private applyCoordinates() {
		const boardEl = this.containerEl.querySelector('.cg-wrap') as HTMLElement;
		if (this.config.enableCoordinates === true) {
			boardEl?.addClass('chess-show-coords');
		} else {
			boardEl?.removeClass('chess-show-coords');
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

	private syncBoard() {
		this.cg.set({
			check: this.chess.inCheck(),
			turnColor: this.getTurnColor(),
			movable: {
				free: false,
				color: this.getTurnColor(),
				dests: this.getPossibleMoves(),
			},
		});

		// Give time for board to render
		setTimeout(() => { this.updateBoardAnnotations() }, 50);

		if (this.sidebar) {
			this.sidebar.redrawMoveList();
		}
	}

	private updateBoardAnnotations() {
		if (!this.config.showAnnotations) {
			return;
		}

		const boardEl = this.containerEl.querySelector('.cg-wrap');
		boardEl.querySelectorAll('.chess-annotation-icon').forEach(el => el.remove());

		if (this.currentMoveIndex >= 0 && this.currentMoveIndex < this.moves.length) {
			const move = this.moves[this.currentMoveIndex];
			if (move.annotation) {
				this.addAnnotationIcon(move.to, move.annotation);
			}
		}
	}

	private addAnnotationIcon(square: Key, annotation: MoveAnnotation) {
		const icon = getAnnotationIcon(annotation);
		const tooltip = getAnnotationTooltip(annotation);
		const boardEl = this.containerEl.querySelector('.cg-wrap');
		let squareEl = boardEl.querySelector(`square.last-move`) as HTMLElement;
		const iconEl = document.createElement('img');

		iconEl.className = `chess-annotation-icon`;
		iconEl.setAttribute('title', tooltip);
		iconEl.setAttribute('alt', tooltip);
		iconEl.setAttribute('src', icon);
		squareEl.appendChild(iconEl);
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
		
		this.syncBoard();
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

	public shouldShowAnnotations(): boolean {
		return this.config.showAnnotations ?? true;
	}

	private presentError(errorMessage: string) {
		presentError(this.containerEl, errorMessage);
	}
}
