import type {DBFieldID, Editor} from "@/domain"
import {NBDBTemplate} from "@/adapter/dataManipulator/nbCRDTWithNBDB/state"

import ChevronRight from "@/presenter/common/icon/chevronRight"
import NBDBSymbol from "@/adapter/dataManipulator/nbCRDTWithNBDB/presenter/NBDBSymbol"
import * as helpers from "./helpers"

import {useState} from "react"

export default (props: Props) => {
  const [propertiesSection] = useState(() => {
    const fields = props.template.allFields.filter(
      field => field.fieldID != props.fieldID
    )
    return {
      title: "Properties",
      keys: fields.map(field => field.fieldID),
      map: fields.reduce<helpers.PredefinedSelectorSection["map"]>(
        (acc, cur) => {
          acc[cur.fieldID] = helpers.fnProp(cur)
          return acc
        },
        {}
      ),
    }
  })

  return (
    <div className="nbdb-formula-selector">
      <Section editor={props.editor} section={propertiesSection} onClick={props.onClick} />
      {helpers.predefinedSelectorSection.map(section => (
        <Section
          editor={props.editor}
          key={section.title}
          section={section}
          onClick={props.onClick}
        />
      ))}
    </div>
  )
}

const Section = ({
  editor,
  section,
  onClick,
}: {
  editor: Editor;
  section: helpers.PredefinedSelectorSection;
  onClick: onClick;
}) => {
  const [expanded, expand] = useState<boolean | 0>(0)

  return (
    <div className="nbdb-formula-selector-section">
      <div
        className="nbdb-formula-selector-section-header"
        onClick={() => {
          editor.emitter.emitHaptic()
          expand(!expanded)
        }}
        data-expandable-container={expanded}
      >
        <ChevronRight />
        <div className="nbdb-formula-selector-section-title">
          {section.title}
        </div>
      </div>
      <div className="nbdb-formula-selector-options" data-expandable={expanded}>
        {section.keys.map(key => (
          <OptionDetails
            key={key}
            editor={editor}
            option={section.map[key]!}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  )
}

const OptionDetails = ({
  editor,
  option,
  onClick,
}: {
  editor: Editor;
  option: helpers.SelectorOption;
  onClick: onClick;
}) => {
  const [expanded, expand] = useState<boolean | 0>(0)

  return (
    <div className="nbdb-formula-selector-option">
      <div
        className="nbdb-formula-selector-option-header"
        data-expandable-container={expanded}
        onClick={() => {
          editor.emitter.emitHaptic()
          expand(!expanded)
        }}
      >
        <div
          className="nb-ui-btn style-label"
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            onClick(option.value)
          }}
        >
          <NBDBSymbol type={option.returnType} />
          {option.name}
        </div>
        <ChevronRight />
      </div>
      <div
        className="nbdb-formula-selector-option-details"
        data-expandable={expanded}
      >
        <div
          className="nbdb-formula-selector-option-details-description"
          dangerouslySetInnerHTML={{__html: option.description}}
        ></div>
        <h4>Syntax</h4>
        <div
          className="nbdb-formula-selector-option-details-syntax"
          dangerouslySetInnerHTML={{__html: option.syntax}}
        ></div>
        <h4>Example</h4>
        <div
          className="nbdb-formula-selector-option-details-example"
          dangerouslySetInnerHTML={{__html: option.example}}
        ></div>
      </div>
    </div>
  )
}

type onClick = (value: string) => void;
type Props = {editor: Editor; template: NBDBTemplate; fieldID?: DBFieldID; onClick: onClick};
