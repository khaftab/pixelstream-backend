"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = __importDefault(require("./auth"));
const upload_1 = __importDefault(require("./upload"));
const webhook_1 = __importDefault(require("./webhook"));
const progress_1 = __importDefault(require("./progress"));
const routes = [
    {
        path: "/api/users",
        handler: auth_1.default,
    },
    {
        path: "/api/uploads",
        handler: upload_1.default,
    },
    {
        path: "/api/webhook",
        handler: webhook_1.default,
    },
    {
        path: "/api/progress",
        handler: progress_1.default,
    },
];
const setRoutes = (app) => {
    routes.forEach((route) => {
        if (route.path === "/") {
            app.get(route.path, route.handler);
        }
        else {
            app.use(route.path, route.handler);
        }
    });
};
exports.default = setRoutes;
