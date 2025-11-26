"use client";

import { useConversation } from "@/hooks/useConversation";
import AvatarDisplay from "@/components/AvatarDisplay";
import ChatInterface from "@/components/ChatInterface";
import MessageInput from "@/components/MessageInput";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ConversationPage() {
  const {
    messages,
    avatarStatus,
    isConnected,
    isAvatarActive,
    sendMessage,
    startAvatar,
    stopAvatar,
  } = useConversation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#4a2c6d] relative overflow-hidden">
      {/* City Background - MOVE HERE (Outside content container) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/tallercity.png"
          alt="City Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Main Content - This container is z-10, so it appears above city */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 md:px-12 py-6">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
              <img
                src="/oshi.png"
                alt="Oshi"
                className="w-[93px] h-[43px] object-contain"
              />
            </motion.div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-white/70">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <motion.button
              className="px-6 py-2 bg-white text-oshi-blue font-bold rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              sign in
            </motion.button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-6 md:px-12 pb-12">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Avatar */}
            <div className="flex items-center justify-center">
              <AvatarDisplay
                isActive={isAvatarActive}
                status={avatarStatus}
                onStart={startAvatar}
                onStop={stopAvatar}
              />
            </div>

            {/* Right Side - Chat */}
            <div className="flex flex-col h-[600px] lg:h-auto">
              <div className="flex-1 bg-oshi-blue/40 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                <ChatInterface messages={messages} />
                <MessageInput
                  onSendMessage={sendMessage}
                  avatarStatus={avatarStatus}
                  isAvatarActive={isAvatarActive}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
        className="relative z-10 border-t border-white/10"
        style={{
          background: "linear-gradient(0deg, #110933 0%, #341A99 100%)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16">
            <div className="flex items-center">
              <img
                src="/oshi.png"
                alt="Oshi"
                className="h-[80px] sm:h-[100px] lg:h-[115px] w-auto object-contain"
              />
            </div>

            <div className="flex flex-col items-center lg:items-start gap-4">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">
                socials
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 border border-white/20"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                <a
                  href="#"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 border border-white/20"
                  aria-label="Discord"
                >
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>

                <a
                  href="#"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 border border-white/20"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start gap-4">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">
                legal
              </h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                <a
                  href="#"
                  className="text-white hover:text-white/80 transition-colors underline underline-offset-4"
                >
                  privacy policy
                </a>
                <a
                  href="#"
                  className="text-white hover:text-white/80 transition-colors underline underline-offset-4"
                >
                  terms & conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
