import React, { useContext, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [isOtpSubmited, setIsOtpSubmited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { backendUrl } = useContext(AppContent)
  axios.defaults.withCredentials = true

  const inputRefs = useRef([])

  const handleInput = (e, index) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow numbers
    e.target.value = value // Update the input value
    
    if (value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '') // Only numbers
    const pasteArray = paste.split('').slice(0, 6) // Limit to 6 digits
    
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char
      }
    })
    
    // Auto focus next available input
    const nextIndex = Math.min(pasteArray.length, 5)
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus()
    }
  }

  // Function to get current OTP from input fields
  const getCurrentOtp = () => {
    return inputRefs.current.map(input => input?.value || '').join('')
  }

  const onSubmitEmail = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email })
      data.success ? toast.success(data.message) : toast.error(data.message)
      data.success && setIsEmailSent(true)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Get OTP directly from input fields
      const otpValue = getCurrentOtp()
      
      console.log('Frontend - OTP being sent:', otpValue, 'Type:', typeof otpValue)
      
      // Validate OTP length
      if (otpValue.length !== 6) {
        toast.error('Please enter a 6-digit OTP')
        setIsLoading(false)
        return
      }
      
      // Update state for future use
      setOtp(otpValue)
      
      const { data } = await axios.post(backendUrl + '/api/auth/verify-reset-otp', { 
        email, 
        otp: otpValue 
      })
      
      console.log('Backend response:', data)
      
      if (data.success) {
        toast.success(data.message)
        setIsOtpSubmited(true)
      } else {
        toast.error(data.message)
        // Clear OTP fields on failure
        inputRefs.current.forEach(input => {
          if (input) input.value = ''
        })
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('OTP submission error:', error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/reset-password', { 
        email, 
        otp, 
        newPassword 
      })
      
      data.success ? toast.success(data.message) : toast.error(data.message)
      if (data.success) {
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
      <img 
        onClick={() => navigate('/')}
        src={assets.logo} 
        alt="" 
        className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
      />

      {/* Enter Email */}
      {!isEmailSent && (
        <form onSubmit={onSubmitEmail} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter Your registered email address</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5c]'>
            <img src={assets.mail_icon} alt="" className='w-3 h-3' />
            <input 
              type="email" 
              placeholder='Email id' 
              className='bg-transparent outline-none text-white w-full' 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3 disabled:opacity-50'
          >
            {isLoading ? 'Sending...' : 'Submit'}
          </button>
        </form>
      )}

      {/* OTP Input Form */}
      {!isOtpSubmited && isEmailSent && (
        <form onSubmit={onSubmitOTP} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset password OTP</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter the 6-digit code sent to your email</p>
          
          <div className='flex justify-between mb-8' onPaste={handlePaste}>
            {Array(6).fill(0).map((_, index) => (
              <input 
                key={index}
                ref={el => inputRefs.current[index] = el}
                onInput={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className='w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md outline-none border border-transparent focus:border-indigo-500'
                type="text" 
                maxLength='1' 
                pattern='[0-9]*'
                inputMode='numeric'
                required 
              />
            ))}
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full disabled:opacity-50'
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {/* Enter New Password */}
      {isOtpSubmited && isEmailSent && (
        <form onSubmit={onSubmitNewPassword} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>New password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter the new password below</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5c]'>
            <img src={assets.lock_icon} alt="" className='w-3 h-3' />
            <input 
              type="password" 
              placeholder='Password' 
              className='bg-transparent outline-none text-white w-full' 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3 disabled:opacity-50'
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default ResetPassword