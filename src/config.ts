import { parseYaml } from "obsidian";
import { Settings } from "./settings";

export interface Config extends Settings {
	id?: string;
	fen: string;
	pgn?: string;
	shapes?: any;
	currentMoveIdx?: number;
	moves?: string[];
	hideMenu?: boolean;
}

const ORIENTATIONS = ["white", "black"];
export const PIECE_STYLES = [
	"alpha",
	"california",
	"cardinal",
	"cburnett",
	"chess7",
	"chessnut",
	"companion",
	"dubrovny",
	"fantasy",
	"fresca",
	"gioco",
	"governor",
	"horsey",
	"icpieces",
	"kosal",
	"leipzig",
	"letter",
	"libra",
	"maestro",
	"merida",
	"pirouetti",
	"pixel",
	"reillycraig",
	"riohacha",
	"shapes",
	"spatial",
	"staunty",
	"tatiana",
];

export const BOARD_STYLES = [
	"blue",
	"brown",
	"green",
	"ic",
	"purple"
];

export function parse_user_config(
	settings: Settings,
	content: string
): Config {
	let userConfig: Config = {
		...settings,
		fen: "",
	};

	try {
		return {
			...userConfig,
			...parseYaml(content),
		};
	} catch (e) {
		// failed to parse
		return userConfig;
	}
}
