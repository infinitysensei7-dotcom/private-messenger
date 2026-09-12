import { Layout } from "@/components/Layout";
import { CallPage } from "@/pages/Call";
import { ConversationPage } from "@/pages/Conversation";
import { HomePage } from "@/pages/Home";
import { SettingsPage } from "@/pages/Settings";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const conversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversation",
  component: ConversationPage,
});

const callRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/call",
  component: CallPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  conversationRoute,
  callRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
