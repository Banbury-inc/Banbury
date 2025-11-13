import { LayoutDashboard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

import { Button } from '../components/ui/button';

const Header = (): JSX.Element => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const storedUsername = localStorage.getItem('username');
      
      if (token && storedUsername) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
      } else {
        setIsLoggedIn(false);
        setUsername('');
      }
    }
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUsername('');
    router.push('/');
  };

  const handleDashboard = () => {
    setIsDropdownOpen(false);
    router.push('/workspaces');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    handleLogout();
  };

  return (
    <>
      <div 
        className="flex justify-between items-center min-h-[70px] px-4 md:px-6" 
        style={{
          background: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo - Left side */}
        <Link href='/' className="text-decoration-none mr-auto">
          <div className="flex items-center">
            <h6 
              className="ml-2.5"
              style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                margin: 0,
              }}
            >
              Banbury
            </h6>
          </div>
        </Link>

        {/* Navigation - Center (hidden on mobile) */}
        <div className="hidden md:flex justify-center">
          <Button 
            asChild 
            variant="ghost" 
            size="lg" 
            className="ml-4 text-zinc-300 hover:text-white hover:bg-zinc-800/50"
            style={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
            }}
          >
            <Link href="/">Home</Link>
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            size="lg"
            className="text-zinc-300 hover:text-white hover:bg-zinc-800/50"
            style={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
            }}
          >
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            size="lg"
            className="text-zinc-300 hover:text-white hover:bg-zinc-800/50"
            style={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
            }}
          >
            <Link href="/docs">Docs</Link>
          </Button>
        </div>

        {/* Right side - Profile/Login */}
        <div className="flex items-center justify-end">
          {isLoggedIn ? (
            <>
              {/* Welcome text - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1 mr-4">
                <span 
                  className="text-sm"
                  style={{
                    color: '#a1a1aa',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  Welcome,
                </span>
                <span 
                  className="text-sm"
                  style={{
                    color: '#ffffff',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {username}
                </span>
              </div>
              
              {/* Profile Icon */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 hover:bg-zinc-800/50"
                  onClick={toggleDropdown}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                  }}
                >
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <User className="h-5 w-5" style={{ color: '#ffffff' }} />
                  </div>
                </Button>
                
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg z-50"
                    style={{
                      background: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="py-1">
                      <button
                        onClick={handleDashboard}
                        className="flex items-center w-full px-4 py-3 text-sm hover:bg-zinc-800/50"
                        style={{
                          color: '#ffffff',
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 400,
                          minHeight: '44px',
                        }}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Open Web App
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="flex items-center w-full px-4 py-3 text-sm hover:bg-zinc-800/50"
                        style={{
                          color: '#ffffff',
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 400,
                          minHeight: '44px',
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              onClick={() => router.push('/login')}
              variant="default"
              size="lg"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500,
                minHeight: '44px',
                padding: '8px 16px',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
