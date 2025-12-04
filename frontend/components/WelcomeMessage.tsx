'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function WelcomeMessage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center space-y-6"
      >
        {/* Avatar Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </motion.div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">
            Welcome to Oshi! 👋
          </h2>
          <p className="text-white/70">
            To start chatting with your vtuber, you need to create an account first.
          </p>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
              1
            </div>
            <div className="text-left">
              <p className="text-white/90 font-medium">Click the "Sign Up" button</p>
              <p className="text-white/60 text-sm">Located at the top right corner</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
              2
            </div>
            <div className="text-left">
              <p className="text-white/90 font-medium">Create your account</p>
              <p className="text-white/60 text-sm">Enter username, email, and password</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
              3
            </div>
            <div className="text-left">
              <p className="text-white/90 font-medium">Start chatting!</p>
              <p className="text-white/60 text-sm">Enjoy conversations with your AI avatar</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <Link href="/signup">
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all mt-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Sign Up Now
            </span>
          </motion.button>
        </Link>

        {/* Already have account */}
        <p className="text-white/60 text-sm">
          Already have an account?{' '}
          <Link href="/signin" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
