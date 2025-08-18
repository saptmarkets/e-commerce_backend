const AboutUs = require('../models/AboutUs');
const Setting = require('../models/Setting');

// Fetch About Us data, with fallback/migration from settings.storeCustomizationSetting.setting.about_us
exports.getAboutUs = async (req, res) => {
	try {
		console.log('🔍 BACKEND: getAboutUs called');
		
		let doc = await AboutUs.findOne({ name: 'aboutUs' });
		console.log('🔍 BACKEND: Found AboutUs document:', {
			hasDoc: !!doc,
			docId: doc?._id,
			docDataKeys: Object.keys(doc?.data || {}),
			docDataStructure: doc?.data?.name,
			aboutUsKeys: Object.keys(doc?.data?.setting?.about_us || {})
		});
		
		if (!doc) {
			console.log('🔍 BACKEND: No AboutUs document found, creating new one with defaults');
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
			console.log('🔍 BACKEND: Created new AboutUs document with ID:', doc._id);
		}
		
		// Extract the actual about_us data from the nested structure
		console.log('🔍 BACKEND: Raw doc.data structure:', {
			docDataKeys: Object.keys(doc.data || {}),
			docDataSettingKeys: Object.keys(doc.data?.setting || {}),
			docDataSettingAboutUsKeys: Object.keys(doc.data?.setting?.about_us || {})
		});
		
		const aboutUsData = doc.data?.setting?.about_us;
		console.log('🔍 BACKEND: Extracted aboutUsData:', {
			aboutUsDataKeys: Object.keys(aboutUsData || {}),
			sampleValues: {
				title: aboutUsData?.title,
				header_status: aboutUsData?.header_status,
				founder_status: aboutUsData?.founder_status,
				branches_status: aboutUsData?.branches_status
			}
		});
		
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
		
		console.log('🔍 BACKEND: Final response data:', {
			responseKeys: Object.keys(responseData),
			sampleResponseValues: {
				title: responseData?.title,
				header_status: responseData?.header_status,
				founder_status: responseData?.founder_status,
				branches_status: responseData?.branches_status
			}
		});
		
		return res.json(responseData);
	} catch (err) {
		console.error('🔍 BACKEND: Error in getAboutUs:', err);
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
		const aboutUsData = aboutUsDoc.data?.setting?.about_us || {};
		
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
		
		console.log('🔍 BACKEND: updateAboutUs called with payload:', {
			payloadType: typeof payload,
			payloadKeys: Object.keys(payload || {}),
			sampleValues: {
				title: payload?.title,
				header_status: payload?.header_status,
				founder_status: payload?.founder_status,
				branches_status: payload?.branches_status
			}
		});
		
		// Store in the nested structure to match existing data format
		const nestedData = {
			name: 'storeCustomizationSetting',
			setting: {
				about_us: payload
			}
		};
		
		console.log('🔍 BACKEND: Storing nested data structure:', {
			nestedDataKeys: Object.keys(nestedData),
			aboutUsKeys: Object.keys(nestedData.setting.about_us || {})
		});
		
		const updated = await AboutUs.findOneAndUpdate(
			{ name: 'aboutUs' },
			{ $set: { data: nestedData } },
			{ new: true, upsert: true }
		);
		
		console.log('🔍 BACKEND: Database update result:', {
			updatedId: updated._id,
			updatedDataKeys: Object.keys(updated.data || {}),
			aboutUsDataKeys: Object.keys(updated.data?.setting?.about_us || {})
		});
		
		// Return the actual about_us data, not the nested structure
		const responseData = updated.data?.setting?.about_us || {};
		console.log('🔍 BACKEND: Returning response data:', {
			responseKeys: Object.keys(responseData),
			sampleResponseValues: {
				title: responseData?.title,
				header_status: responseData?.header_status,
				founder_status: responseData?.founder_status,
				branches_status: responseData?.branches_status
			}
		});
		
		return res.json(responseData);
	} catch (err) {
		console.error('🔍 BACKEND: Error in updateAboutUs:', err);
		return res.status(500).json({ message: err.message });
	}
}; 