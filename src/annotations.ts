// Analysis icons
import brilliantIcon from "../assets/analysis-icon/brilliant.svg";
import greatIcon from "../assets/analysis-icon/great.svg";
import mistakeIcon from "../assets/analysis-icon/mistake.svg";
import inaccuracyIcon from "../assets/analysis-icon/inaccuracy.svg";
import blunderIcon from "../assets/analysis-icon/blunder.svg";
import checkmateIcon from "../assets/analysis-icon/checkmate.svg";

export type MoveAnnotation = "!!" | "!" | "?!" | "?" | "??" | "#";

export const sanRegex = /([BRQNK][a-h][1-8]|[BRQNK][a-h]x[a-h][1-8]|[BRQNK][a-h][1-8]x[a-h][1-8]|[BRQNK][a-h][1-8][a-h][1-8]|[BRQNK][a-h][a-h][1-8]|[BRQNK]x[a-h][1-8]|[a-h]x[a-h][1-8]=(B+R+Q+N)|[a-h]x[a-h][1-8]|[a-h][1-8]x[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]x[a-h][1-8]|[a-h][1-8][a-h][1-8]=(B+R+Q+N)|[a-h][1-8][a-h][1-8]|[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]|[BRQNK][1-8]x[a-h][1-8]|[BRQNK][1-8][a-h][1-8]|O-O|O-O-O)\+?/g

export const annotationRegex = /(\?\?|\?\!|!!|!|\?|#)/;

export function getAnnotationClass(annotation: MoveAnnotation): string {
    switch (annotation) {
        case "!!": return "brilliant";
        case "!": return "great";
        case "?!": return "inaccuracy";
        case "?": return "mistake";
        case "??": return "blunder";
        case "#": return "checkmate";
    }
}

export function getAnnotationIcon(annotation: MoveAnnotation): string {
    switch (annotation) {
        case "!!": return brilliantIcon;
        case "!": return greatIcon;
        case "?!": return inaccuracyIcon;
        case "?": return mistakeIcon;
        case "??": return blunderIcon;
        case "#": return checkmateIcon;
    }
}

export function getAnnotationTooltip(annotation: MoveAnnotation): string {
    return annotation[0].toUpperCase() + annotation.slice(1);
}
