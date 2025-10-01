import { useEffect, useState } from 'react';
import { RadioButtonsGroup } from '../../RadioButtonsGroup';
import { useLocation } from 'react-router';
import Logo from '../../../assets/Logo.svg';
import styles from './header.module.css';
import cx from "clsx";

const currentButtonSelected = (location: string) => {
  if (location == "/") {
    return [true, false];
  } else {
    return [false, true];
  }
}

export const Header = () => {
  const location = useLocation();
  const [buttonsSelected, setButtonsSelected] = useState(currentButtonSelected(location.pathname));

  useEffect(() => {
    setButtonsSelected(currentButtonSelected(location.pathname));
  }, [location]);

  

  return (
    <header className={cx(styles.header, styles.container)}>
      <div className={cx(
        styles.container,
        styles.header__logo_container
      )}>
        <div
          className={cx(styles.header__logo)}
        >
          <img src={Logo} alt="logo" />
        </div>
        <p
          className={cx(styles.header__tittle)}
        >
          Conversor álgebra relacional
        </p>
      </div>
      <nav className={cx(
        styles.container,
      )}>
        <RadioButtonsGroup
          groupName='HeaderNavOptions'
          buttonsTitles={["Inicio", "Construye"]}
          links={["/", "playground"]}
          initialButtonsSelected={buttonsSelected}
        />
      </nav>
    </header>
  )
}

