import {useRef, useLayoutEffect} from "react"

export default (props: Props) => {
  const ref = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (props.focused) {
      ref.current?.focus()
    }
  })

  return (
    <input
      ref={ref}
      type={props.type}
      pattern={props.pattern}
      min={props.min}
      max={props.max}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      style={{...defaultStyle, ...props.style}}
    />
  )
}

type Props = React.ComponentProps<"input"> & {focused?: boolean};

const defaultStyle = {
  border: "1px solid var(--fg-color)",
  borderRadius: "var(--border-radius-form)",
  boxShadow: "none",
  outline: "none",
  fontSize: "0.8em",
  height: "32px",
  padding: "0 4px",
}
