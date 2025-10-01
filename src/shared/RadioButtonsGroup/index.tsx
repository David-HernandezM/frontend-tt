import { useState, useEffect } from "react";
import { RadioButton } from "../RadioButton";
import { useNavigate } from "react-router";
import cx from "clsx";
import styles  from "./radiobuttonsgroup.module.css";

interface Props {
  groupName: string,
  buttonsTitles: string[];
  links?: string[];
  styleUnselected?: boolean;
  initialButtonsSelected?: boolean[];
  activeButtons?: boolean[];
  onButtonSelected?: (buttonId: number) => void;
}

export const RadioButtonsGroup = ({ 
  groupName, 
  buttonsTitles, 
  links, 
  styleUnselected = false, 
  initialButtonsSelected, 
  activeButtons,
  onButtonSelected = () => {}
}: Props) => {
  if (buttonsTitles.length < 1) throw new Error("Group cant be empty");
  if (initialButtonsSelected && initialButtonsSelected.length != buttonsTitles.length) throw new Error("Arrays lenght are different (initialButtonsSelected and buttonsTitles)!");
  if (activeButtons && activeButtons.length != buttonsTitles.length) throw new Error("Arrays lenght are different (activeButtons and buttonsTitles)!");

  const navigate = useNavigate();
  const [buttonsSelected, setButtonsSelected] = useState<boolean[]>((() => {
    if (!initialButtonsSelected) {
      const temp = Array(buttonsTitles.length).fill(false);
      temp[0] = true;
      return temp;
    }

    return initialButtonsSelected;
  })());
  const [buttonsDissabled, setButtonsDissabled] = useState((() => {
    if (!activeButtons) {
      const temp = Array(buttonsTitles.length).fill(true);
      return temp;
    }

    return activeButtons;
  })());

  function setRadioButtonSelected(buttonId: string) {
    const id = Number((buttonId.split("-"))[1]);
    const newSelectedButton = Array(buttonsTitles.length).fill(false);
    newSelectedButton[id] = true;

    setButtonsSelected(newSelectedButton);
    onButtonSelected(id);
    if (links && links[id]) {
      navigate(links[id]); // Navega al enlace correspondiente
    }
  }

  useEffect(() => {
    if (!initialButtonsSelected) return;

    setButtonsSelected(initialButtonsSelected);
  }, initialButtonsSelected);

  useEffect(() => {
    if (!activeButtons) return;

    setButtonsDissabled(activeButtons);
  }, [activeButtons]);

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
              onSelect={buttonsDissabled[index] && setRadioButtonSelected}
              selected={buttonsSelected[index]}
              styleUnselected={!buttonsDissabled[index] && styleUnselected}
            />
            
          </div>
        ))
      }
    </div>
  )
}