const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

 const userSchema = new mongoose.Schema({
   name: {
     type: String,
     required: [true, 'A user must have a name.'],
   },
   email: {
     type: String,
     required: [true, 'A user must have a password.'],
     unique: [true, 'A user with this email already exits.'],
     lowercase: true,
     validate: [validator.isEmail, 'Please provide an email.'],
   },
   photo: {
     type: String,
     default: 'default.jpg'
   },
   password: {
     type: String,
     required: [true, 'Please provide a password.'],
     minlength: 8,
     select: false,
   },
   passwordConfirm: {
     type: String,
     required: [true, 'Please confirm the password.'],
     validate: {
       validator: function(el) {
         return el === this.password;
       },
       message: 'Passwords do not match!'
     },
   },
   passwordChangedAt: Date,
   role: {
     type: String,
     enum: ['user', 'guide', 'lead-guide', 'admin'],
     default: 'user'
   },
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
     type: Boolean,
     default: true,
     select: false
   },
 });

 userSchema.pre('save', async function(next) {
   if (!this.isModified('password')) return next();
   this.password = this.password = await bcrypt.hash(this.password, 12);
   this.passwordConfirm = undefined;
   next();
 });

 userSchema.pre('save', function(next) {
   if (!this.isModified('password') || this.isNew) return next();
   this.passwordChangedAt = Date.now() - 1000;
   next();
 });

 userSchema.pre(/^find/, function(next) {
   this.find({active: {$ne: false}});
   next();
 });

 userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
   return await bcrypt.compare(candidatePassword, userPassword);
 }

 userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
   if (this.passwordChangedAt) {
     const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
     console.log(changedTimestamp, JWTTimestamp);
     return JWTTimestamp < changedTimestamp;
   }
   return false;
 };

 userSchema.methods.createPasswordResetToken = function() {
   const resetToken = crypto.randomBytes(32).toString('Hex');
   this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('Hex');
   console.log({resetToken}, this.passwordResetToken);
   this.passwordResetExpires = Date.now() + 10*60*1000;
   return resetToken;
 }

 const User = mongoose.model('User', userSchema);

 module.exports = User;
