import { Link } from 'react-router';
import type { PropsWithChildren } from 'react';
import styles from './Button.module.css';
import cx from 'clsx';

interface Props extends PropsWithChildren {
    linkData?: {
        url: string;
    };
    onClick?: () => void
}

export const Button = ({linkData, onClick = () => {}, children}: Props) => {
  return linkData ? (
    <Link
        className={cx(
          styles.button,
          styles.button_a,
        )}
        to={linkData.url}
    >
        { children }
    </Link>
  ) : (
    <button
        className={styles.button}
        onClick={onClick}
    >
        { children }
    </button>
  );
}
