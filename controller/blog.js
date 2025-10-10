const model = require('../model/blog');
const Blog = model.Blog;
exports.createBlog = async(req, res)=>{

const {title,decription,auther,date}= req.body;
const image = req.files[0]

if(!req.files[0]){
    return res.status(400).send('No image file uploaded.');
}
const newBlog = new Blog({
    title,
    decription,
    auther,
    image: image.path
})

const exitTitle = await Blog.findOne({title});
if(exitTitle){
    return res.status(409).send({
    code: 409,
    message: 'Title already Use'
});
}
const success = await newBlog.save();
if(success){
    return res.status(200).send({code:200, message: 'Sucessfully added', data:success
})
}else{
return res.status(400).send('Server Error');
}
}


exports.viewBlog = async(req, res)=>{
    const showAllBlog = await Blog.find();
    try {
        return res.status(200).send({
            code: 200,
            message: 'Blogs retrieved Successfully',
            data: showAllBlog,
    });
     }catch (error) {
        return res.status(400).send('Server Error'); 
        
    }
}


exports.getBlog= async(req, res)=>{
    const { id } = req.params;
    const getBlog = await Blog.findById(id);
    try {
        return res.status(200).send({
        code: 200,
        data: getBlog,
    });
    }catch (error) {
    return res.status(400).send('Server Error');
 }
}


exports.deleteBlog = async(req, res)=>{
    const {id} = req.params;
    const deleteBlog = await Blog.findByIdAndDelete(id);
    if(!deleteBlog){
        return res.status(404).json({ message: `No Blog found with ID ${id}` });  
    }
    try {
        return res.status(200).send({
            code: 200,
            message:'Deleted Data Successfully'
        });
    } catch (error) {
    return res.status(400).send('Server Error');    
    }
}



exports.updateBlog = async (req, res) => {
  try {
    

    const { id } = req.params;


    const updateData = {
      title: req.body.title,
      decription: req.body.decription,
      auther: req.body.auther,
    };

    if (req.files && req.files[0]) {
      updateData.image = req.files[0].path;
    } else if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBlog) {
      return res.status(404).json({ code: 404, message: `No blog found with ID ${id}` });
    }

    return res.status(200).json({
      code: 200,
      message: "Blog Data Update successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({ code: 500, message: "Server Error" });
  }
};

