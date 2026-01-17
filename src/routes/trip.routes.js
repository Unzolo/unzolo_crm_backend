const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const validate = require('../middlewares/validate.middleware');
const { createTrip, updateTrip } = require('../validations/trip.validation');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', validate(createTrip), tripController.createTrip);
router.get('/', tripController.getTrips);
router.get('/:id', tripController.getTripById);
router.patch('/:id', validate(updateTrip), tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
