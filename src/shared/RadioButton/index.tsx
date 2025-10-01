import styles from './radiobutton.module.css';
import cx from "clsx";

interface Props {
  name: string,
  id: string,
  title: string,
  selected?: boolean,
  styleUnselected?: boolean,
  onSelect?: (id: string) => void
}

export const RadioButton = ({title, name, id, selected = false, styleUnselected = false, onSelect = () => {}}: Props) => {
  return (
    <label
        className={cx(
          styles.radio_button,
          selected && styles.radio_button__selected,
          styleUnselected && !selected && styles.radio_button__unselected
        )}
    >
      <input 
        type="radio" 
        name={name} 
        checked={selected}
        onChange={(e) => {
          if (e.target.checked && onSelect) {
            onSelect(id);
          }
        }}
      />
      {title}
    </label>
  )
}
