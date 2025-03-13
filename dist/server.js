"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const checkEnvVariables_1 = require("./utils/checkEnvVariables");
const routes_1 = __importDefault(require("./routes/routes"));
require("dotenv").config();
const app = (0, express_1.default)();
app.set("trust proxy", true);
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: [process.env.ORIGINS],
}));
console.log("origins", process.env.ORIGINS);
app.use((0, cookie_parser_1.default)());
(0, routes_1.default)(app);
(0, checkEnvVariables_1.checkEnvVariables)(["MONGO_URI"]);
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    console.log("Connected to MongoDB");
    const port = process.env.PORT || 3002;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})
    .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});
app.get("/haka", (req, res) => {
    res.send(`Hello World ${process.env.NODE_ENV}`);
});
app.all("*", (req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});
