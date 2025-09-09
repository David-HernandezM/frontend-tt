import { useState } from 'react';
import styles from './radiobutton.module.css';
import cx from "clsx";

interface Props {
  name: string,
  id: string,
  title: string,
  selected?: boolean,
  onSelect?: (id: string) => void
}

export const RadioButton = ({title, name, id, selected = false, onSelect = () => {}}: Props) => {
  return (
    <label
        className={cx(
          styles.radio_button,
          selected && styles.radio_button__selected
        )}
    >
      <input 
        type="radio" 
        name={name} 
        checked={selected}
        onChange={(e) => {
          console.log(id);  
          console.log(e.target.checked);
          if (e.target.checked && onSelect) {
            console.log("Si se tiene una funcion para esto");
            onSelect(id);
          }
        }}
      />
      {title}
    </label>
  )
}
