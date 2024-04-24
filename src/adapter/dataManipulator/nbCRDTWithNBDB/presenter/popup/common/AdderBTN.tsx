import PlusIcon from "@/presenter/common/icon/plus"

export default ({onClick}: {onClick: () => void}) => (
  <div className="nb-ui-btn role-adder" onClick={onClick}>
    <PlusIcon />
  </div>
)
