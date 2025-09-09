import { Home } from "../home";
import { Root } from "./Root";
import { PlayGround } from "../playground";
import { createBrowserRouter } from "react-router";

export default createBrowserRouter([
    {
        path: '/',
        Component: Root,
        children: [
            {
                Component: Home,
                index: true
            },
            {
                path: "playground",
                Component: PlayGround
            }
        ]
    }
]);