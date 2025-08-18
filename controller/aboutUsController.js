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
			
			// Store in the nested structure to match existing data format
			doc = await AboutUs.create({ 
				name: 'aboutUs', 
				data: {
					name: 'storeCustomizationSetting',
					setting: {
						about_us: defaultStructure
					}
				}
			});
		}
		
		// Extract the actual about_us data from the nested structure
		const aboutUsData = doc.data?.setting?.about_us || doc.data;
		
		// Ensure the response has all required boolean fields with defaults if missing
		const responseData = {
			header_status: aboutUsData?.header_status ?? true,
			header_bg: aboutUsData?.header_bg ?? "",
			content_left_status: aboutUsData?.content_left_status ?? true,
			content_right_status: aboutUsData?.content_right_status ?? true,
			top_section_image: aboutUsData?.top_section_image ?? "",
			content_middle_status: aboutUsData?.content_middle_status ?? true,
			content_middle_Img: aboutUsData?.content_middle_Img ?? "",
			founder_status: aboutUsData?.founder_status ?? true,
			founder_one_img: aboutUsData?.founder_one_img ?? "",
			founder_two_img: aboutUsData?.founder_two_img ?? "",
			founder_three_img: aboutUsData?.founder_three_img ?? "",
			founder_four_img: aboutUsData?.founder_four_img ?? "",
			founder_five_img: aboutUsData?.founder_five_img ?? "",
			founder_six_img: aboutUsData?.founder_six_img ?? "",
			branches_status: aboutUsData?.branches_status ?? true,
			// Include all other data from the correct path
			...aboutUsData
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
			aboutUsDoc = await AboutUs.create({ 
				name: 'aboutUs', 
				data: {
					name: 'storeCustomizationSetting',
					setting: {
						about_us: legacyData
					}
				}
			});
		}
		
		// Extract the actual about_us data from the nested structure
		const aboutUsData = aboutUsDoc.data?.setting?.about_us || aboutUsDoc.data || {};
		
		// Merge the data: base settings + about us data merged into about_us section
		const mergedData = {
			...baseData,
			about_us: {
				...baseData?.about_us, // Keep existing boolean fields and structure
				...aboutUsData          // Override with new bilingual content
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
		
		// Store in the nested structure to match existing data format
		const nestedData = {
			name: 'storeCustomizationSetting',
			setting: {
				about_us: payload
			}
		};
		
		const updated = await AboutUs.findOneAndUpdate(
			{ name: 'aboutUs' },
			{ $set: { data: nestedData } },
			{ new: true, upsert: true }
		);
		
		// Return the actual about_us data, not the nested structure
		return res.json(updated.data?.setting?.about_us || {});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}; 