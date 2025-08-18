const mongoose = require("mongoose");

const AboutUsSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			default: "aboutUs",
			unique: true,
			index: true,
		},
		data: {
			type: Object,
			default: {},
			required: true,
		},
	},
	{ timestamps: true }
);

const AboutUs = mongoose.model("AboutUs", AboutUsSchema);
module.exports = AboutUs; 