'use client';

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [expandedHeroCard, setExpandedHeroCard] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const heroCards = [
    {
      id: 1,
      title: "Smart AI Analysis",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      bgColor: "bg-blue-100",
      borderColor: "border-blue-300",
      shortDesc: "AI-powered insights to identify high-quality leads",
      fullDesc: "Our advanced AI algorithms analyze thousands of data points to identify the most promising leads for your business. Machine learning models continuously improve accuracy, helping you focus on prospects most likely to convert."
    },
    {
      id: 2,
      title: "Automated Outreach",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      shortDesc: "Engage prospects automatically with personalized messages",
      fullDesc: "Set up automated email sequences, follow-ups, and multi-channel campaigns. Our AI personalizes each message based on prospect behavior, interests, and engagement history to maximize response rates."
    },
    {
      id: 3,
      title: "Real-time Analytics",
      icon: (
        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: "bg-pink-100",
      borderColor: "border-pink-300",
      shortDesc: "Track performance and optimize your campaigns",
      fullDesc: "Get instant insights into campaign performance with live dashboards. Track open rates, click-through rates, conversions, and ROI. Make data-driven decisions with comprehensive analytics and reporting tools."
    }
  ];

  const features = [
    {
      id: 1,
      title: "Easy Setup",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      gradient: "from-green-400 to-green-600",
      shortDesc: "Get started in minutes with our intuitive interface",
      fullDesc: "Our platform is designed for simplicity. With a step-by-step onboarding process, you can set up your first lead generation campaign in under 5 minutes. No technical knowledge required - just sign up, configure your preferences, and start generating leads immediately."
    },
    {
      id: 2,
      title: "Secure & Private",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      gradient: "from-yellow-400 to-yellow-600",
      shortDesc: "Your data is encrypted and protected at all times",
      fullDesc: "We take security seriously. All your data is encrypted with industry-standard AES-256 encryption, both in transit and at rest. We're GDPR compliant, SOC 2 certified, and never share your data with third parties. Your leads and business information remain completely private and secure."
    },
    {
      id: 3,
      title: "Team Collaboration",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-red-400 to-red-600",
      shortDesc: "Work together seamlessly with your team",
      fullDesc: "Invite unlimited team members, assign roles and permissions, and collaborate in real-time. Share lead lists, track team performance, leave comments, and manage workflows together. Built-in communication tools keep everyone on the same page and maximize productivity."
    },
    {
      id: 4,
      title: "24/7 Support",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: "from-indigo-400 to-indigo-600",
      shortDesc: "Get help whenever you need it from our expert team",
      fullDesc: "Our dedicated support team is available around the clock via live chat, email, and phone. Get instant answers to your questions, troubleshooting help, and expert advice on optimizing your lead generation campaigns. Average response time under 2 minutes."
    }
  ];

  const toggleFeature = (id: number) => {
    setExpandedFeature(expandedFeature === id ? null : id);
  };

  const toggleHeroCard = (id: number) => {
    setExpandedHeroCard(expandedHeroCard === id ? null : id);
  };

  const openAuthModal = (isLogin: boolean) => {
    setIsLoginMode(isLogin);
    setShowAuthModal(true);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
      const body = isLoginMode
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Network error occurred');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                AI<span className="text-blue-600">Lead</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => openAuthModal(true)} className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition">
                Login
              </button>
              <button onClick={() => openAuthModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold border border-blue-100">
                🚀 AI-Powered Lead Generation
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Generate Quality
              <span className="block text-blue-600">Leads with AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Transform your business with intelligent lead generation. 
              Leverage AI to find, qualify, and convert prospects automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={() => openAuthModal(false)} className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition flex items-center justify-center">
                Get Started Free
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-xl">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900">500K+</div>
                <div className="text-sm text-gray-600">Leads Generated</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              {heroCards.map((card) => (
                <div key={card.id} className={`bg-gray-50 rounded-xl border border-gray-200 hover:${card.borderColor} hover:shadow-md transition ${card.id === 2 ? 'ml-8' : ''}`}>
                  <button onClick={() => toggleHeroCard(card.id)} className="w-full p-6 text-left">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-gray-900 font-semibold text-lg">{card.title}</h3>
                          <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedHeroCard === card.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm">{card.shortDesc}</p>
                      </div>
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedHeroCard === card.id ? 'max-h-48' : 'max-h-0'}`}>
                    <div className="px-6 pb-6 pt-2">
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-600 text-sm leading-relaxed">{card.fullDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose AILead?</h2>
            <p className="text-gray-600 text-lg">Everything you need to supercharge your lead generation</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition">
                <button onClick={() => toggleFeature(feature.id)} className="w-full p-6 text-left">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-900 font-semibold text-lg">{feature.title}</h3>
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedFeature === feature.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">{feature.shortDesc}</p>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedFeature === feature.id ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 pb-6 pt-2">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.fullDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeAuthModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeAuthModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-600">
                {isLoginMode ? 'Login to your account' : 'Create a new account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLoginMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLoginMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isLoginMode ? 'Login' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
