
import React from 'react';
import { AlertTriangle, CheckCircle, Zap, Target, Clock, FileSpreadsheet } from 'lucide-react';
import LottieBackground from './LottieBackground';
import AnimatedGif from './AnimatedGif';

const ProblemSolutionSection = () => {
  return (
    <section className="py-20 md:py-32 bg-black relative overflow-hidden">
      {/* Lottie Background Animation */}
      <LottieBackground className="z-0" />
      
      <div className="container-section relative z-10">
        <h2 className="section-title">The SEO Data Problem</h2>
        
        {/* Problem Description */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
              Every Monday: Export GSC data. Clean messy spreadsheets. Create charts in PowerPoint. Explain data gaps to clients. Repeat.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-center mt-6">
              <div>
                <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">3+ hours wasted</div>
              </div>
              <div>
                <FileSpreadsheet className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Manual data cleaning</div>
              </div>
              <div>
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Missed opportunities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">DataPulsify: Built by an SEO Who Got Tired of This</h3>
          
          {/* Add GIF placeholder - Replace this URL with your actual GIF */}
          <div className="flex justify-center mb-8">
            <AnimatedGif
              src="https://via.placeholder.com/600x400/1f2937/60a5fa?text=Your+GIF+Here"
              alt="DataPulsify Demo GIF"
              className="max-w-lg mx-auto"
            />
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-xl md:text-2xl font-bold text-white mb-4">
                Two powerful platforms. One seamless workflow.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-blue-400 mr-3" />
                  <h4 className="text-xl font-bold">Google Sheets Add-on</h4>
                </div>
                <p className="text-gray-300 mb-4">Work where you already live – inside your familiar spreadsheets with powerful GSC integration.</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• One-click data import</li>
                  <li>• Smart filtering & queries</li>
                  <li>• No sampling limits</li>
                </ul>
              </div>
              
              <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-purple-400 mr-3" />
                  <h4 className="text-xl font-bold">Beautiful Dashboard</h4>
                </div>
                <p className="text-gray-300 mb-4">When you need to impress clients or dive deep into visual analysis and insights.</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Click gap analysis</li>
                  <li>• AI-powered insights</li>
                  <li>• Client-ready reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;