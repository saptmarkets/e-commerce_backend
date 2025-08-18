const AboutUs = require('../models/AboutUs');
const Setting = require('../models/Setting');

// Fetch About Us data, with fallback/migration from settings.storeCustomizationSetting.setting.about_us
exports.getAboutUs = async (req, res) => {
	try {
		let doc = await AboutUs.findOne({ name: 'aboutUs' });
		if (!doc) {
			// Fallback: try to migrate from settings if exists
			const legacy = await Setting.findOne({ name: 'storeCustomizationSetting' });
			const legacyData = legacy?.setting?.about_us || {};
			doc = await AboutUs.create({ name: 'aboutUs', data: legacyData });
		}
		return res.json(doc.data || {});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

// Update About Us data; upsert document and persist full bilingual objects
exports.updateAboutUs = async (req, res) => {
	try {
		const payload = req.body?.data || req.body || {};
		const updated = await AboutUs.findOneAndUpdate(
			{ name: 'aboutUs' },
			{ $set: { data: payload } },
			{ new: true, upsert: true }
		);
		return res.json({ message: 'About Us updated', data: updated.data });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}; 