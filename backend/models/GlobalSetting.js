const mongoose = require('mongoose');

const globalSettingSchema = new mongoose.Schema(
  {
    default_currency: {
      type: String,
      required: true,
    },
    default_currency_position: {
      type: String,
      enum: ['left', 'right'],
      default: 'left',
    },
    default_date_format: {
      type: String,
      required: true,
    },
    default_time_zone: {
      type: String,
      required: true,
    },
    default_language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['show', 'hide'],
      default: 'show',
    },
  },
  {
    timestamps: true,
  }
);

const GlobalSetting = mongoose.model('GlobalSetting', globalSettingSchema);
module.exports = GlobalSetting; 