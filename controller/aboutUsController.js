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
			
			// Create default structure with all required boolean fields
			const defaultStructure = {
				header_status: true,
				header_bg: "",
				content_left_status: true,
				content_right_status: true,
				top_section_image: "",
				content_middle_status: true,
				content_middle_Img: "",
				founder_status: true,
				founder_one_img: "",
				founder_two_img: "",
				founder_three_img: "",
				founder_four_img: "",
				founder_five_img: "",
				founder_six_img: "",
				branches_status: true,
				// Merge legacy data with defaults
				...legacyData
			};
			
			doc = await AboutUs.create({ name: 'aboutUs', data: defaultStructure });
		}
		
		// Ensure the response has all required boolean fields with defaults if missing
		const responseData = {
			header_status: doc.data?.header_status ?? true,
			header_bg: doc.data?.header_bg ?? "",
			content_left_status: doc.data?.content_left_status ?? true,
			content_right_status: doc.data?.content_right_status ?? true,
			top_section_image: doc.data?.top_section_image ?? "",
			content_middle_status: doc.data?.content_middle_status ?? true,
			content_middle_Img: doc.data?.content_middle_Img ?? "",
			founder_status: doc.data?.founder_status ?? true,
			founder_one_img: doc.data?.founder_one_img ?? "",
			founder_two_img: doc.data?.founder_two_img ?? "",
			founder_three_img: doc.data?.founder_three_img ?? "",
			founder_four_img: doc.data?.founder_four_img ?? "",
			founder_five_img: doc.data?.founder_five_img ?? "",
			founder_six_img: doc.data?.founder_six_img ?? "",
			branches_status: doc.data?.branches_status ?? true,
			// Include all other data
			...doc.data
		};
		
		return res.json(responseData);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

// NEW: Get ALL store customization data by merging Setting and AboutUs collections
exports.getAllStoreCustomization = async (req, res) => {
	try {
		// Get base store customization data (navbar, homepage, contact, etc.)
		const baseSettings = await Setting.findOne({ name: 'storeCustomizationSetting' });
		const baseData = baseSettings?.setting || {};
		
		// Get About Us data from dedicated collection
		let aboutUsDoc = await AboutUs.findOne({ name: 'aboutUs' });
		if (!aboutUsDoc) {
			// Fallback: try to migrate from settings if exists
			const legacyData = baseData?.about_us || {};
			aboutUsDoc = await AboutUs.create({ name: 'aboutUs', data: legacyData });
		}
		
		// Merge the data: base settings + about us data merged into about_us section
		const mergedData = {
			...baseData,
			about_us: {
				...baseData?.about_us, // Keep existing boolean fields and structure
				...aboutUsDoc.data      // Override with new bilingual content
			}
		};
		
		return res.json(mergedData);
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