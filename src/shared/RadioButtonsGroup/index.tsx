import { useState, useRef } from "react";
import { RadioButton } from "../RadioButton";
import { Link, useNavigate } from "react-router";
import cx from "clsx";
import styles  from "./radiobuttonsgroup.module.css";

interface Props {
  groupName: string,
  buttonsTitles: string[],
  links?: string[]
}

export const RadioButtonsGroup = ({ groupName, buttonsTitles, links }: Props) => {
  if (buttonsTitles.length < 1) throw new Error("Group cant be empty");

  const navigate = useNavigate();
  const linkRef = useRef(null);
  const [buttonIndexSelected, setButtonIndexSelected] = useState(links ? (links.length > 0 ? 1 : 0) : 0);
  const [buttonsSelected, setButtonsSelected] = useState<boolean[]>((() => {
    const temp = Array(buttonsTitles.length).fill(false);
    temp[0] = true;
    return temp;
  })());

  console.log(buttonsSelected);

  function temp(id: number) {
    setButtonIndexSelected(id);
  }

  function setRadioButtonSelected(buttonId: string) {
    const id = Number((buttonId.split("-"))[1]);
    const newSelectedButton = Array(buttonsTitles.length).fill(false);
    newSelectedButton[id] = true;

    temp(id);

    // setButtonIndexSelected(id);
    setButtonsSelected(newSelectedButton);
    if (links && links[id]) {
      navigate(links[id]); // Navega al enlace correspondiente
    }
  }

  return (
    <div
      className={cx(styles.radio_buttons_group)}
    >
      {
        buttonsTitles.map((buttonTitle, index) => (
          <div>
            <RadioButton
              key={buttonTitle + "-" + index}
              title={buttonTitle}
              name={groupName}
              id={buttonTitle + "-" + index}
              onSelect={setRadioButtonSelected}
              selected={buttonsSelected[index]}
            />
            
          </div>
        ))
      }
      { links && <Link ref={linkRef} to={links[buttonIndexSelected]}/> }
    </div>
  )
}