import {list as viewList} from "@/presenter/blocks/typedContent/code/prismjs"
import {keys} from "./codeLangs"

describe("check code languages", () => {
  describe("code language selector", () => {
    it("should have valid key set", () => {
      const viewListSet = new Set(Object.keys(viewList))

      keys.forEach(key => {
        if (viewListSet.has(key)) {
          viewListSet.delete(key)
        } else {
          fail(`unknown code-language ${key}`)
        }
      })

      expect(viewListSet).toStrictEqual(new Set())
    })
  })
})
