import type {Theme} from "@/domain/entity"

import mermaid from "mermaid"

export const setMermaid = (nbTheme: Theme) => {
  const theme = nbTheme === "black" ? "dark" : "default"

  mermaid.initialize({
    startOnLoad: false,
    theme,
    logLevel: 4,
    securityLevel: "strict",
    arrowMarkerAbsolute: false,
    flowchart: {
      htmlLabels: true,
      curve: "linear",
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: true,
    },
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      numberSectionStyles: 4,
      axisFormat: "%Y-%m-%d",
    },
  })
}

setMermaid(
  window.document.body.className === "black-theme" ? "black" : "light"
)

export default mermaid
