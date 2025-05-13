
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CircleUser, Users, CircleHelp } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <section className="mb-16 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">About DataPulsify</h1>
            <p className="text-gray-300 text-lg md:text-xl text-center mb-12">
              Empowering SEO and data professionals with intelligent tools to transform data into actionable insights.
            </p>
            
            <div className="bg-gray-900 rounded-xl p-8 mb-12 border border-gray-800">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-300">
                At DataPulsify, our mission is to simplify data analysis for SEO professionals by creating intuitive tools 
                that bridge the gap between complex data sources and actionable insights. We believe that data should be 
                accessible, understandable, and most importantly, useful for making strategic decisions.
              </p>
            </div>
            
            <div className="mb-16">
              <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
              <p className="text-gray-300 mb-4">
                DataPulsify was born out of frustration with existing SEO data tools. As SEO professionals ourselves, 
                we spent countless hours manually exporting and manipulating Google Search Console data in spreadsheets. 
                We knew there had to be a better way.
              </p>
              <p className="text-gray-300 mb-4">
                In 2024, we set out to create a solution that would automate the tedious parts of data collection and 
                organization, allowing SEO teams to focus on what really matters—analysis and strategy. What started 
                as a simple Google Sheets add-on has evolved into a comprehensive suite of tools designed specifically 
                for SEO and data professionals.
              </p>
              <p className="text-gray-300">
                Today, DataPulsify helps hundreds of businesses transform their search data into valuable insights, 
                saving them time and uncovering opportunities they might have otherwise missed.
              </p>
            </div>
          </section>
          
          <section className="mb-16 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Our Team</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
                <div className="mx-auto w-24 h-24 bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <CircleUser size={36} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Harsh Shah</h3>
                <p className="text-blue-400 mb-3">Founder & CEO</p>
                <p className="text-gray-400 text-sm">
                  Former SEO lead at a Fortune 500 company with 10+ years of experience in search analytics.
                </p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
                <div className="mx-auto w-24 h-24 bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                  <CircleUser size={36} className="text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Twinkal Shah</h3>
                <p className="text-purple-400 mb-3">CTO</p>
                <p className="text-gray-400 text-sm">
                  Data scientist with expertise in building scalable analytics platforms and API integrations.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-16 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mr-4">
                    <Users size={24} className="text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold">User-Centric Design</h3>
                </div>
                <p className="text-gray-300">
                  We build our tools with real users in mind, constantly seeking feedback and refining our products to meet the needs of SEO professionals.
                </p>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mr-4">
                    <CircleHelp size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Data Transparency</h3>
                </div>
                <p className="text-gray-300">
                  We believe in making data clear and accessible, with transparent processes that help users understand how their information is being used.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;