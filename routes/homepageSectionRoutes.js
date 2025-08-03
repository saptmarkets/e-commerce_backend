const express = require('express');
const router = express.Router();

const {
  getAllSections,
  getSectionById,
  updateSection,
  toggleSection,
  initializeSections,
  updateSectionsOrder,
  cleanupDuplicates,
  getActiveSections
} = require('../controller/homepageSectionController');

// Get all sections for admin
router.get('/admin/all', getAllSections);

// Get active sections for customer app
router.get('/active', getActiveSections);

// Get single section
router.get('/:sectionId', getSectionById);

// Update section
router.put('/:sectionId', updateSection);

// Toggle section active/inactive
router.put('/:sectionId/toggle', toggleSection);

// Initialize default sections
router.post('/initialize', initializeSections);

// Update sections order
router.put('/order/update', updateSectionsOrder);

// Clean up duplicate sections
router.post('/cleanup-duplicates', cleanupDuplicates);

module.exports = router; 