import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ChatPage } from "../pages/ChatPage";
import { WishlistPage } from "../pages/WishlistPage";

export const appRouter = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <ChatPage /> },
      { path: "/wishlist", element: <WishlistPage /> }
    ]
  }
]);
