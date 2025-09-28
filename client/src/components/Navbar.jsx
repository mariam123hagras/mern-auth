import React, { useContext, useState, useRef, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Navbar = () => {
    const navigate = useNavigate()
    const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContent)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [])

    const sendVerificationOtp = async () => {
        try {
            axios.defaults.withCredentials = true
            const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp')
            if (data.success) {
                navigate('/email-verify')
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const logout = async () => {
        try {
            axios.defaults.withCredentials = true
            const { data } = await axios.post(backendUrl + '/api/auth/logout')
            if (data.success) {
                setIsLoggedin(false)
                setUserData(null)
                setIsDropdownOpen(false)
                navigate('/')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    return (
        <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0'>
            <img src={assets.logo} alt="logo" className='w-28 sm:w-32' />
            
            {userData ? (
                <div className='relative' ref={dropdownRef}>
                    <div 
                        className='w-8 h-8 flex justify-center items-center rounded-full bg-black text-white cursor-pointer'
                        onClick={toggleDropdown}
                    >
                        {userData.name[0].toUpperCase()}
                    </div>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className='absolute top-full right-0 z-10 text-black rounded mt-2 shadow-lg'>
                            <ul className='list-none m-0 p-2 bg-white text-sm min-w-32 rounded-lg border border-gray-200'>
                                {!userData.isAccountVerified && (
                                    <li 
                                        onClick={() => {
                                            sendVerificationOtp()
                                            setIsDropdownOpen(false)
                                        }}
                                        className='py-2 px-3 hover:bg-gray-100 cursor-pointer rounded-md transition-colors'
                                    >
                                        Verify email
                                    </li>
                                )}
                                <li 
                                    onClick={() => {
                                        logout()
                                        setIsDropdownOpen(false)
                                    }}
                                    className='py-2 px-3 hover:bg-gray-100 cursor-pointer rounded-md transition-colors'
                                >
                                    Logout
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <button 
                    className='flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all' 
                    onClick={() => navigate('/login')}
                >
                    Login
                    <img src={assets.arrow_icon} alt="arrow-icon" />
                </button>
            )}
        </div>
    )
}

export default Navbar