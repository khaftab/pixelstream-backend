"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSafeFileName = void 0;
const generateSafeFileName = (originalName) => {
    const extension = originalName.split(".").pop();
    const baseName = originalName.slice(0, -(extension.length + 1));
    // Clean filename and add UUID
    return `${baseName
        .replace(/[^a-zA-Z0-9_-]/g, "_") // More permissive than your current regex
        .slice(0, 100)}_${crypto.randomUUID().slice(0, 8)}.${extension}`;
};
exports.generateSafeFileName = generateSafeFileName;
// Example: "My Video!@.mp4" → "My_Video__6f3a8b.mp4"
