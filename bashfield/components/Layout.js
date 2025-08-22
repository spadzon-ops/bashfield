import { useEffect, useState } from "react";
import Link from "next/link";

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return; // only apply scroll hide/show on mobile

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        // scrolling down
        setShowMenu(false);
      } else {
        // scrolling up
        setShowMenu(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Menu */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md transition-transform duration-300 ${
          isMobile && !showMenu ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Bashfield
            </span>
          </Link>
          <div className="space-x-4">
            <Link href="/favorites" className="text-gray-700 dark:text-gray-200">
              Favorites
            </Link>
            <Link href="/profile" className="text-gray-700 dark:text-gray-200">
              Profile
            </Link>
          </div>
        </nav>
      </header>

      {/* Padding so content is not hidden under fixed header */}
      <div className="pt-16">{children}</div>
    </div>
  );
}
