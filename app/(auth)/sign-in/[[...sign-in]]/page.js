import { SignIn } from '@clerk/nextjs'
import React from 'react'

const Signin = () => {
  return (
    <div className=' flex items-center justify-center w-full h-screen'>
      <SignIn path='/sign-in'/>
    </div>
  )
}

export default Signin