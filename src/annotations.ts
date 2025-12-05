// Analysis icons
import brilliantIcon from "../assets/analysis-icon/brilliant.svg";
import greatIcon from "../assets/analysis-icon/great.svg";
import mistakeIcon from "../assets/analysis-icon/mistake.svg";
import inaccuracyIcon from "../assets/analysis-icon/inaccuracy.svg";
import blunderIcon from "../assets/analysis-icon/blunder.svg";

export type MoveAnnotation = "!!" | "!" | "?!" | "?" | "??";

export function getAnnotationClass(annotation: MoveAnnotation): string {
    switch (annotation) {
        case "!!": return "brilliant";
        case "!": return "great";
        case "?!": return "inaccuracy";
        case "?": return "mistake";
        case "??": return "blunder";
    }
}

export function getAnnotationIcon(annotation: MoveAnnotation): string {
    switch (annotation) {
        case "!!": return brilliantIcon;
        case "!": return greatIcon;
        case "?!": return inaccuracyIcon;
        case "?": return mistakeIcon;
        case "??": return blunderIcon;
    }
}

export function getAnnotationTooltip(annotation: MoveAnnotation): string {
    return annotation[0].toUpperCase() + annotation.slice(1);
}
