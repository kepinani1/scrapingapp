var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var InputSchema = new Schema({
  name: {
    type: String
  },
  body: {
    type: String,
    required: true
  }
});

var Input = mongoose.model("Input", InputSchema);

module.exports = Input;