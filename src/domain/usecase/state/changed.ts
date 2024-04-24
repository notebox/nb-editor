import type {BlockID} from "@/domain/entity"

export class ChangedBlockIDs {
  private changed = new Set<string>()
  private observers: ChangedBlockIDsObserver[] = []

  add(blockID: BlockID) {
    this.changed.add(blockID)
  }

  has(blockID: BlockID): boolean {
    return this.changed.has(blockID)
  }

  extract(blockID: BlockID): boolean {
    if (this.changed.has(blockID)) {
      this.changed.delete(blockID)
      return true
    }
    return false
  }

  subscribe(subscriber: ChangedBlockIDsObserver) {
    this.observers.push(subscriber)
  }

  publish() {
    this.observers.forEach(observer => observer.update(this.changed))
  }
}

export interface ChangedBlockIDsObserver {
  update: (changed: Set<string>) => void
}
