const mongoose = require('mongoose');
const {Schema} = mongoose;
const blogSchema = new Schema({
    title: { type: String},
    decription:{ type:String},
    image:{ type:String},
    auther:{ type:String}
},
{ timestamps: true }
)
exports.Blog = mongoose.model('Blog' ,blogSchema)
