const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // These two lines are for reviews only.
    let filter = {};
    if (req.params.tourId) filter = {tour: req.params.tourId};

    // Execute query
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    const doc = await features.query;
    // const tours = await query;

    // Sending response
    res.status(200).json({
      status: "Success",
      results: doc.length,
      data: {
        data: doc
      },
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document with that Id!', 404));
    }
    res.status(200).json({
      status: "success",
      data: {data: doc}
    });
});

exports.createOne = Model => catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "Success",
      data: {
        data: doc
      }
    });
});

exports.updateOne = Model => catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('No document with that Id!', 404));
    }
    res.status(200).json({
      status: "Success",
      data: {
        data: doc
      }
    });
})

exports.deleteOne = Model => catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document with that Id!', 404));
    }
    res.status(200).json({
      status: "Success",
      data: null
    });
});
