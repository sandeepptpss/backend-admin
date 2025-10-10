const mongoose = require("mongoose")
const  MONGO_URl =process.env.MONGO_URI;
mongoose.connect(MONGO_URl)
.then(()=>console.log('Connected to MongoDB'))
.catch((error)=>console.error('mongo connection error',error))