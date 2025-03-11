"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.passwordEncrypt = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
const passwordEncrypt = (password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hashedpassword = yield bcrypt_1.default.hash(password, saltRounds);
        return hashedpassword;
    }
    catch (error) {
        console.error("Error hashing the password", error);
    }
});
exports.passwordEncrypt = passwordEncrypt;
const verifyPassword = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const match = yield bcrypt_1.default.compare(password, hashedPassword);
        return match;
    }
    catch (error) {
        console.error("Error verifying the password", error);
    }
});
exports.verifyPassword = verifyPassword;
