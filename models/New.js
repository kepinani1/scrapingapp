var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NewSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  //Could not scrape images so I commented out the below. However, if scrapping was successful, the below should have worked.
  // img: {
  //   type: { data: Buffer, contentType: String },
  //   required: true
  // },
  input: [{
    type: Schema.Types.ObjectId,
    ref: "Input"
  }]
});

var New = mongoose.model("New", NewSchema);

//export model
module.exports = New;