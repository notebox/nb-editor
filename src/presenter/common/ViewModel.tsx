import {useState} from "react"

export default class ViewModel {
  private renderer = 0
  private setRenderer?: (renderer: number) => void

  setStates() {
    const [_renderer, setRenderer] = useState(0)
    this.setRenderer = setRenderer
  }

  rerender = () => {
    this.setRenderer?.(++this.renderer)
  }
}
