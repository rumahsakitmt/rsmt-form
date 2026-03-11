"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      const container = document.getElementById("main-scroll-container");
      const containerScroll = container ? container.scrollTop : 0;

      if (windowScroll > 300 || containerScroll > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.addEventListener("scroll", toggleVisibility);
    }

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (container) {
        container.removeEventListener("scroll", toggleVisibility);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    
    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={scrollToTop}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-academic-black text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-12 sm:right-12"
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </div>
  );
}
