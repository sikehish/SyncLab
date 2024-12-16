
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, FileUp, Code, Video, MessageSquare, Terminal, ChevronRight, ChevronLeft, Github, PenTool } from 'lucide-react'
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react"

const features = [
  { id: 'os', icon: <Monitor className="h-8 w-8" />, title: 'Collaborative OS', description: 'Access a shared desktop/OS for seamless remote collaboration. Work together in real-time on a unified platform.' },
  { id: 'file', icon: <FileUp className="h-8 w-8" />, title: 'File Transfer', description: 'Effortlessly transfer files between your local system and the shared OS. Drag and drop functionality for easy file management.' },
  { id: 'code', icon: <Code className="h-8 w-8" />, title: 'Code Editors', description: 'Use built-in VS Code or our extra code editor for your projects. Syntax highlighting and real-time collaboration features included.' },
  { id: 'video', icon: <Video className="h-8 w-8" />, title: 'Video Calling', description: 'Communicate face-to-face with integrated high-quality video call features. Screen sharing and virtual backgrounds supported.' },
  { id: 'chat', icon: <MessageSquare className="h-8 w-8" />, title: 'Real-time Chat', description: 'Stay connected with instant messaging during your session. Threaded conversations and emoji reactions for effective communication.' },
  { id: 'script', icon: <Terminal className="h-8 w-8" />, title: 'Startup Scripts', description: 'Initialize your environment with custom startup scripts. Automate setup processes for consistent development environments.' },
]

const useCases = [
  { id: 'hackathons', title: 'Hackathons', description: 'Collaborate efficiently in time-sensitive coding competitions. Shared environment ensures everyone is on the same page.' },
  { id: 'learning', title: 'Learning Linux', description: 'Practice and learn Linux commands in a safe, shared environment. Instructors can provide real-time assistance and demonstrations.' },
  { id: 'teaching', title: 'Remote Teaching', description: 'Conduct interactive coding classes with real-time demonstrations. Students can follow along in their own workspace.' },
  { id: 'reviews', title: 'Code Reviews', description: 'Review and discuss code together in a shared development environment. Highlight and comment on specific code sections in real-time.' },
]

export default function HomeContent() {
  const [activeFeature, setActiveFeature] = useState('os')
  const [activeUseCase, setActiveUseCase] = useState(0)
  const { user } = useUser()

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveUseCase((prev) => (prev + 1) % useCases.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <main className="container mx-auto px-6 py-12 space-y-24">
        <section className="text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Revolutionize Your<br />Remote Collaboration
          </motion.h1>
          <motion.p 
            className="text-xl mb-8 max-w-2xl mx-auto text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Experience the future of teamwork with Synclab's innovative shared OS platform.
            Collaborate seamlessly, code efficiently, and communicate effectively.
          </motion.p>
          <SignedIn>
            <motion.div
              className="text-2xl font-semibold text-blue-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Welcome back, {user?.firstName || 'User'}!
            </motion.div>
          </SignedIn>
          <SignedOut>
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </motion.a>
            </motion.div>
          </SignedOut>
        </section>

        <section>
          <h2 className="text-4xl font-bold mb-12 text-center">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${activeFeature === feature.id ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                  onClick={() => setActiveFeature(feature.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-4">{features.find(f => f.id === activeFeature)?.title}</h3>
                <p className="text-gray-300">{features.find(f => f.id === activeFeature)?.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section>
          <h2 className="text-4xl font-bold mb-12 text-center">Endless Possibilities</h2>
          <div className="relative w-full max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeUseCase}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-4">{useCases[activeUseCase].title}</h3>
                <p className="text-gray-300">{useCases[activeUseCase].description}</p>
              </motion.div>
            </AnimatePresence>
            <button 
              onClick={() => setActiveUseCase((prev) => (prev - 1 + useCases.length) % useCases.length)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 bg-gray-700 p-2 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={() => setActiveUseCase((prev) => (prev + 1) % useCases.length)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 bg-gray-700 p-2 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Synclab?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
            Synclab is a college project showcasing the future of remote collaboration. While it's not available for public use, we'd love to hear your thoughts!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              href="https://github.com/sikehish/SyncLab"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              View on GitHub
              <Github className="ml-2 h-5 w-5" />
            </motion.a>
            <motion.a
              href="mailto:hisham0502@gmail.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              Provide Feedback
              <PenTool className="ml-2 h-5 w-5" />
            </motion.a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-24">
          <footer className="border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 SyncLab. All rights reserved.</p>
          </footer>
      </footer>
    </div>
  )
}

