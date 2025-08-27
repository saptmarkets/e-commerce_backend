const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../config/auth');
const ctrl = require('../controller/stockPushSessionController');

router.get('/', isAuth, isAdmin, ctrl.listSessions);
router.get('/stats', isAuth, isAdmin, ctrl.getStats);
router.post('/', isAuth, isAdmin, ctrl.createSession);
router.post('/:id/sync', isAuth, isAdmin, ctrl.syncSession);
router.delete('/:id', isAuth, isAdmin, ctrl.deleteSession);

module.exports = router; 