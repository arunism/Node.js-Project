const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A tour must have a name."],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name should contain 5 to 40 characters.'],
    minlength: [5, 'A tour name should contain 5 to 40 characters.']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, "A tour must have a duration."]
  },
  maxGroupSize: {
    type: Number,
    required: [true, "A tour must have a Group Size."],
  },
  difficulty: {
    type: String,
    required: [true, "A tour must have a difficulty."],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty should be either easy or medium or difficult.'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'The rating should be between 1 and 5.'],
    max: [5, 'The rating should be between 1 and 5.'],
    set: val => Math.round(val*10)/10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, "A tour must have a price."],
  },
  discount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be less than regular price.'
    }
  },
  summary: {
    type: String,
    required: [true, "A tour must have a summary."],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, "A tour must have a Cover image."],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  startDates: [Date],
  secretTours: {
    type: Boolean,
    default: false
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],
},

{
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});

tourSchema.index({price: 1});
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration/7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// Document Middleware
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true});
  next();
});

// Query Middleware
tourSchema.pre(/^find/, function(next) {
  this.find({secretTours: {$ne: true}});
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} miliseconds!`)
//   next();
// });

// Aggregation Middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({$match : {secretTours: {$ne: true}}});
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
