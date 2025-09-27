
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

import transporter from '../config/nodemailer.js';

export const register= async(req,res)=>{
const {name,email,password}=req.body;
if(!name || !email || !password){

return res.json({success:false, message:'All fields are required'});

}

try {

  const existingUser= await userModel.findOne({email}); 
    if(existingUser){
        return res.json({success:false, message:'User already exists'});
    } 
  const  hashedPassword= await bcrypt.hash(password,10);
  const user= new userModel({name,email,password:hashedPassword});
  await user.save();

  const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
  res.cookie('token',token,{
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite: process.env.NODE_ENV==='production'?'none':'strict',
    maxAge:7*24*60*60*1000
  })
  //sending welcome email
  const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:email,
    subject:'Welcome to Hesn',
    text:`Hello ${name},\n\nWelcome to Hesn! We're excited to have you on board.\n\nBest regards,\nThe Hesn Team`

  }
  await transporter.sendMail(mailOptions);
  res.json({success:true, message:'User registered successfully'});
} catch (error) {
    res.json({success:false, message:error.message});
}

}


export const login=async(req,res)=>{
  const {email,password}=req.body;
  if(!email || !password){
    return res.json({success:false, message:'Email and password are required'});
  }
  try {
    const user = await userModel.findOne({email});
    if(!user){
      return res.json({success:false, message:'Invalid email or password'});
    }
    const isMatch= await bcrypt.compare(password,user.password);
    if(!isMatch){
      return res.json({success:false, message:'Invalid email or password'});
    }
     const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
  res.cookie('token',token,{
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite: process.env.NODE_ENV==='production'?'none':'strict',
    maxAge:7*24*60*60*1000
  })
  return res.json({success:true, message:'Login successful'});

  } catch (error) {
    return res.json({success:false, message:error.message});
    
  }
}


export const logout=(req,res)=>{
  try {
   res.clearCookie('token',{
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite: process.env.NODE_ENV==='production'?'none':'strict',
    });
    return res.json({success:true, message:'Logout successful'});
  } catch (error) {
    return res.json({success:false, message:error.message});
  }

}

//send otp to user email for verification
export const sendVerifyOtp=async(req,res)=>{
try {

  const {userId} = req.user;
  const user= await userModel.findById(userId);
  if(user.isAccountVerified){
    return res.json({success:false,message:'Account is already verified'});
  }
  const otp=String(Math.floor(100000+Math.random()*900000));
  user.verifyOtp=otp;
  user.verifyOtpExpireAt=Date.now()+24*60*60*1000 //otp valid for 10 minutes
 await user.save();
  const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:user.email,
    subject:'Account Verification OTP',
    // text:`Your OTP is ${otp} .Verify your account within 24 hours`,
    html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    
  }
  await transporter.sendMail(mailOptions);
  res.json({success:true,message:'OTP sent to your email'});
} catch (error) {
  res.json({success:false,message:error.message});
}
}

//verify user account using otp

export const verifyEmail=async(req,res)=>{

  const { userId } = req.user; // From userAuth middleware
  const { otp } = req.body;
  
  if (!otp) {
    return res.json({ success: false, message: 'OTP is required' });
  }

  try {
    
    const user=await userModel.findById(userId);
    if(!user){
      return res.json({success:false,message:'User not found'});
    }
    if(user.verifyOtp!==otp||user.verifyOtp===''){
      return res.json({success:false,message:'Invalid OTP'});}

    if(user.verifyOtpExpireAt<Date.now()){
      return res.json({success:false,message:'OTP has expired'});
    }  
    user.isAccountVerified=true;
    user.verifyOtp='';
    user.verifyOtpExpireAt=0;
    await user.save();
    return res.json({success:true,message:'Account verified successfully'});


  } catch (error) {
    return res.json({success:false,message:error.message});
  }
}

//check if user is authenticated
// export const isAuthenticated=async(req,res)=>{
//    const { userId } = req.user;
   
//   try {
//       if(userId){
//         return res.json({success:true,message:'User is authenticated'});
//       }
     
  
//   } catch (error) {
//     res.json({success:false,message:error.message});
//   }

// }

// Send password reset OTP to user email

export const sendResetOtp=async(req,res)=>{
  const {email}=req.body;
  if(!email){
    return res.json({success:false,message:'Email is required'});
  }
try {
  const user= await userModel.findOne({email});
  if(!user){
    return res.json({success:false,message:'User not found'});
  }
  const otp=String(Math.floor(100000+Math.random()*900000));
  user.resetOtp=otp;
  user.resetOtpExpireAt=Date.now()+15*60*1000 //otp valid for 15 minutes
 await user.save();
  const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:user.email,
    subject:'Password Reset OTP',
    // text:`Your OTP is ${otp} .Use this OTP to reset your password within 15 minutes`,
    html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    
  }
  await transporter.sendMail(mailOptions);
  res.json({success:true,message:'OTP sent to your email'});

} catch (error) {
  return res.json({success:false,message:error.message});
}
}

//reset user password using otp

export const resetPassword=async(req,res)=>{
  const {email,otp,newPassword}=req.body;
  if(!email || !otp || !newPassword){
    return res.json({success:false,message:'All fields are required'});
  }
  try {
    
    const user=await userModel.findOne({email});
    if(!user){
      return res.json({success:false,message:'User not found'});
    }
    if(user.resetOtp!==otp||user.resetOtp===''){
      return res.json({success:false,message:'Invalid OTP'});}  
    if(user.resetOtpExpireAt<Date.now()){
      return res.json({success:false,message:'OTP has expired'});
    } 
    const hashedPassword= await bcrypt.hash(newPassword,10);
    user.password=hashedPassword;
    user.resetOtp='';
    user.resetOtpExpireAt=0;
    await user.save();
    return res.json({success:true,message:'Password reset successfully'});
  } catch (error) {
    return res.json({success:false,message:error.message});
  }
}