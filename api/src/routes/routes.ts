import auth from "./auth";
import upload from "./upload";
import webhook from "./webhook";
import progress from "./progress";
import { Express } from "express";

const routes = [
  {
    path: "/api/users",
    handler: auth,
  },
  {
    path: "/api/uploads",
    handler: upload,
  },
  {
    path: "/api/webhook",
    handler: webhook,
  },
  {
    path: "/api/progress",
    handler: progress,
  },
];

const setRoutes = (app: Express) => {
  routes.forEach((route) => {
    if (route.path === "/") {
      app.get(route.path, route.handler);
    } else {
      app.use(route.path, route.handler);
    }
  });
};

export default setRoutes;
