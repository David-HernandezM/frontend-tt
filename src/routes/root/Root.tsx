import { Header } from "../../shared/layouts/header";
import { Footer } from "../../shared/layouts/footer";
import { Outlet } from "react-router";
import styles from './root.module.css';

export const Root = () => {
  return (
    <>
        <Header />
        <div
          className={styles.root__content_container}
        >
          <Outlet />
          <Footer />
        </div>
    </>
  )
}
