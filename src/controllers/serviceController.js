const Service = require('../models/Service');
const ApiError = require('../utils/apiError');

// Create Service (Provider only)
exports.createService = async (req, res, next) => {
  try {
    const service = await Service.create({
      ...req.body,
      provider: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Services (Public)
exports.getAllServices = async (req, res, next) => {
  try {
    // Filtering
    const queryObj = {};

    if (req.query.category) queryObj.category = req.query.category;
    if (req.query.location) queryObj.location = req.query.location;
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
    }

    queryObj.isActive = true;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const services = await Service.find(queryObj)
      .populate('provider', 'name email phone')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Service.countDocuments(queryObj);

    res.status(200).json({
      status: 'success',
      results: services.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Service
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name email phone');

    if (!service) {
      return next(new ApiError('Service not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// Update Service (Owner only)
exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return next(new ApiError('Service not found', 404));
    }

    // Check ownership
    if (service.provider.toString() !== req.user.id) {
      return next(new ApiError('You can only update your own services', 403));
    }

    service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

// Delete Service (Owner only)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return next(new ApiError('Service not found', 404));
    }

    // Check ownership
    if (service.provider.toString() !== req.user.id) {
      return next(new ApiError('You can only delete your own services', 403));
    }

    await Service.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get My Services (Provider)
exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ provider: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: services.length,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};