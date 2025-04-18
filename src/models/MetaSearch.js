const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const metaSearchSchema = new Schema({
  vendor: {
    name: {
      type: String,
      required: true
    },
    referenceId: {
      type: String,
      required: true
    }
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('MetaSearch', metaSearchSchema, 'metaSearch');