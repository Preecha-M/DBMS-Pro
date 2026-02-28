import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import './StartupLoader.css';

export default function StartupLoader() {
  const { t } = useTranslation();
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    t('startupLoader.msg1'),
    t('startupLoader.msg2'),
    t('startupLoader.msg3'),
    t('startupLoader.msg4'),
    t('startupLoader.msg5')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="startup-loader-container">
      <div className="startup-loader-backdrop"></div>
      
      <div className="startup-loader-content">
        <div className="fancy-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        
        <h2 className="startup-title">CP POS <span>System</span></h2>
        
        <div className="startup-message-box">
          <p className="startup-message" key={msgIndex}>
            {messages[msgIndex]}
          </p>
        </div>
        
        <div className="loading-progress">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
