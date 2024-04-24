import {Color} from "@/domain/entity"

const Label = (props: {name: string; color?: Color; isHoverable?: boolean}) => {
  return (
    <span
      className={`nbdb-label ${
        props.isHoverable ? "hoverable" : ""
      } nb-bgcolor-${props.color ?? Color.Gray}`}
    >
      {props.name}
    </span>
  )
}

export default Label
