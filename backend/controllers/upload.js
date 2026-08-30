

const uploadController = {
  async postUploadImage(req, res, next) {
    res.json({
      status: "success",
      data: {
        image_url: "https://example.com/your-uploaded-image.jpg",
      },
    });
  },
}


module.exports = uploadController;