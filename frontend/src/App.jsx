import React from "react";
import UploadForm from "./components/UploadForm";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

function App() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 15,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{
          backgroundSize: "200% 200%",
        }}
      />

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <UploadForm />
      </div>

      {/* Toast Notifications */}
      <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;
