import { Header } from "../shared/layouts/header";
import { Outlet } from "react-router";

export const Root = () => {
  return (
    <>
        <Header />
        <Outlet />
    </>
  )
}
