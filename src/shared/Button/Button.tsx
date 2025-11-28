import { Link } from 'react-router';
import type { PropsWithChildren } from 'react';
import styles from './Button.module.css';
import cx from 'clsx';

interface Props extends PropsWithChildren {
    linkData?: {
        url: string;
    };
    onClick?: () => void,
    isRed?: boolean,
    classname?: String
}

export const Button = ({linkData, onClick = () => {}, isRed = false, classname, children}: Props) => {
  return linkData ? (
    <Link
        className={cx(
          styles.button,
          styles.button_a,
          isRed && styles.button_red
        )}
        to={linkData.url}
    >
        { children }
    </Link>
  ) : (
    <button
        className={cx(
          styles.button,
          isRed && styles.button_red,
          classname
        )}
        onClick={onClick}
    >
        { children }
    </button>
  );
}
