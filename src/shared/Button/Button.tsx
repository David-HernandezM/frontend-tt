import type { PropsWithChildren } from 'react';
import styles from './Button.module.css';

interface Props extends PropsWithChildren {
    linkData?: {
        url: string;
    };
    onClick?: () => void
}

export const Button = ({linkData, onClick = () => {}, children}: Props) => {
  return linkData ? (
    <a 
        className={styles.button_a}
        href={linkData.url}
    >
        { children }
    </a>
  ) : (
    <button
        className={styles.button}
    >
        { children }
    </button>
  );
}
