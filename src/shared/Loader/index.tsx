import styles from './loader.module.css';

export const Loader = () => {
  return (
    <div className={styles.spinner_container}>
      <div className={styles.spinner}></div>
    </div>
  )
}
