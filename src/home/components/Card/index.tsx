import styles from './card.module.css';
import cx from 'clsx';

interface Props {
    title: string;
    description: string;
    icon: string;
}

export const Card = ({ title, description, icon }: Props) => {
  return (
    <div
        className={cx(styles.card)}
    >
        <div
            className={styles.card__title_container}
        >
            <h3
                className={cx(
                    styles.card__title,
                    styles.text_format
                )}
            >
                {title}
            </h3>
            <div>
                <img src={icon} alt={title + " card icon"} />
            </div>
        </div>
        <p
            className={cx(
                styles.card__description,
                styles.text_format
            )}
        >
            {description}
        </p>
    </div>
  )
}
