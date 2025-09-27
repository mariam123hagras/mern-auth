import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Emailverify from './pages/Emailverify'
import ResetPassword from './pages/ResetPassword'
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <div>
    <ToastContainer />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/email-verify" element={<Emailverify />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
    </div>
  )
}

export default App
