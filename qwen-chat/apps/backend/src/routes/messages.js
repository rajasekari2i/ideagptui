const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireOllama } = require('../middleware/ollamaGuard');

router.get('/:id/messages', requireOllama, messageController.listMessages);
router.post('/:id/messages', requireOllama, messageController.sendMessage);
router.delete('/:id/messages', requireOllama, messageController.clearMessages);
router.delete('/:id/messages/:messageId', requireOllama, messageController.deleteMessageAndAfter);
router.post('/:id/stop', messageController.stopStream);

module.exports = router;
