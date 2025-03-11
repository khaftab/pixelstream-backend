"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    uploadCount: {
        type: Number,
        default: 6,
    },
    files: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "File",
        },
    ],
});
exports.User = mongoose_1.default.model("User", userSchema);
