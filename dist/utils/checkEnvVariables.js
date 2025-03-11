"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEnvVariables = void 0;
const checkEnvVariables = (envVariables) => {
    for (let envVariable of envVariables) {
        if (!process.env[envVariable]) {
            throw new Error(`${envVariable} must be defined for ${process.env.SERVICE_NAME}`);
        }
    }
};
exports.checkEnvVariables = checkEnvVariables;
