const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireOllama } = require('../middleware/ollamaGuard');

router.get('/', requireOllama, sessionController.listSessions);
router.post('/', requireOllama, sessionController.createSession);
router.get('/:id', requireOllama, sessionController.getSession);
router.patch('/:id', requireOllama, sessionController.updateSession);
router.delete('/:id', requireOllama, sessionController.deleteSession);

module.exports = router;
