'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    // Check if all fields are filled
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    // Validate username (3-20 characters, alphanumeric and underscore only)
    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const existingUsers = JSON.parse(localStorage.getItem('oshi_users') || '[]');
      const usernameExists = existingUsers.some((u: any) => u.username === formData.username);
      const emailExists = existingUsers.some((u: any) => u.email === formData.email);

      if (usernameExists) {
        setError('Username already taken. Please choose another one.');
        setIsLoading(false);
        return;
      }

      if (emailExists) {
        setError('Email already registered. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // Create new user
      const user = {
        id: Date.now().toString(),
        username: formData.username,
        email: formData.email,
        password: formData.password, // In production, this should be hashed!
        createdAt: new Date().toISOString(),
      };

      // Save to users list
      existingUsers.push(user);
      localStorage.setItem('oshi_users', JSON.stringify(existingUsers));

      // Set current user (without password)
      const currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      };
      localStorage.setItem('oshi_user', JSON.stringify(currentUser));

      // Redirect to conversation page
      router.push('/conversation');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#4a2c6d] relative overflow-hidden">
      {/* City Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/tallercity.png"
          alt="City Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <img
                src="/oshi.png"
                alt="Oshi"
                className="w-[120px] h-auto mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-white/60">Join Oshi and start chatting with your vtuber</p>
          </div>

          {/* Sign Up Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                  placeholder="Choose a unique username"
                  disabled={isLoading}
                  maxLength={20}
                />
                <p className="mt-1 text-xs text-white/50">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-start gap-2"
                >
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <Link href="/signin" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-white/40">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-white/60 hover:text-white/80 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-white/60 hover:text-white/80 underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
