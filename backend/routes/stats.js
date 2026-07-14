const express = require('express');
const Task = require('../models/Task');
const { computeTaskStats } = require('../utils/taskStats');

const router = express.Router();

// GET task stats
router.get('/', async (req, res) => {
  const tasks = await Task.find();
  res.json(computeTaskStats(tasks));
});

module.exports = router;
