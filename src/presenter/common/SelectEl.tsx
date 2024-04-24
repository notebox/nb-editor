export default (props: Props) => (
  <select
    value={props.value}
    onChange={props.onChange}
    style={style}
    disabled={props.disabled}
  >
    {props.children}
  </select>
)

type Props = React.ComponentProps<"select">;

const style = {
  border: "none",
  borderRadius: "var(--border-radius-form) !important",
  accentColor: "black",
  fontSize: "0.8em",
  height: "32px",
}
