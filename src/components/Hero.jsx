import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero fade-in">
      <div className="hero-content">
        <div className="badge">✨ Figma to React Prototype</div>
        <h1 className="hero-title">
          Build <span className="text-gradient">Stunning</span> Digital Experiences
        </h1>
        <p className="hero-description">
          This is a placeholder modern landing page generated because we cannot see the exact Figma design without a screenshot. Please upload a screenshot of your Figma design to get an exact match!
        </p>
        <div className="hero-actions">
          <button className="btn-primary">Start Building</button>
          <button className="btn-secondary">View Documentation</button>
        </div>
      </div>
      
      <div className="hero-visual">
        <div className="mock-window glass-panel">
          <div className="window-header">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="window-body">
            <div className="skeleton-line w-3/4"></div>
            <div className="skeleton-line w-full"></div>
            <div className="skeleton-line w-5/6"></div>
            <div className="skeleton-box mt-4"></div>
          </div>
        </div>
        <div className="glow-orb"></div>
      </div>
    </section>
  );
};

export default Hero;
