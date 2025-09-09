import { RadioButtonsGroup } from '../../RadioButtonsGroup';
import styles from './header.module.css';
import cx from "clsx";

export const Header = () => {
  return (
    <header className={cx(styles.header, styles.container)}>
      <div className={cx(
        styles.container,
        styles.header__logo_container
      )}>
        <div
          className={cx(styles.header__logo)}
        >
          Image
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
        />
      </nav>
    </header>
  )
}

