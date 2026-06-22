"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tiktok_controller_1 = require("../controllers/tiktok.controller");
const router = (0, express_1.Router)();
router.post('/analyze', tiktok_controller_1.analyzeUrl);
exports.default = router;
