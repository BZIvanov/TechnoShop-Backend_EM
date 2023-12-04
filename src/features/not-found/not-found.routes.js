const express = require('express');
const { notFound } = require('./not-found.controllers');

const router = express.Router();

router.all('/', notFound);

module.exports = router;
