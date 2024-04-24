
import {ChangedBlockIDs} from "./changed"
import {EditedStateHandler} from "./edited"
import {WorkingStateHandler} from "./working"
import {ThemeStateHandler} from "./theme"
import {PopupStateHandler} from "./popup"
import {DragStateHandler} from "./drag"
import {MouseStateHandler} from "./mouse"
import {SelectionHandler} from "./selection"

export class State {
  readonly edited: EditedStateHandler
  readonly working: WorkingStateHandler
  readonly theme: ThemeStateHandler
  readonly drag: DragStateHandler
  readonly popup: PopupStateHandler
  readonly mouse: MouseStateHandler
  readonly selection: SelectionHandler
  readonly changed: ChangedBlockIDs = new ChangedBlockIDs()
  readonly id: string

  readOnly: false | ReadOnlyOptions = false

  constructor() {
    const id = `${++State.num}`

    this.id = id
    this.edited = new EditedStateHandler(id)
    this.working = new WorkingStateHandler(id)
    this.theme = new ThemeStateHandler(id)
    this.popup = new PopupStateHandler(id)
    this.selection = new SelectionHandler(id)
    this.drag = new DragStateHandler(id)
    this.mouse = new MouseStateHandler(id)
  }

  private static num = 0

  reRender() {
    this.changed.publish()
    this.edited.set()
  }
}

export type ReadOnlyOptions = {
  expanded: boolean;
};