import { LayoutDashboard, LogOut, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

import { Button } from '../components/common/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/common/ui/sheet';

const Header = (): JSX.Element => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <div 
        className="relative flex min-h-[70px] items-center justify-between overflow-hidden border-b border-border bg-background px-4 text-foreground md:px-6" 
        style={{
          zIndex: 10,
        }}
      >
        <Link href='/' className="text-decoration-none mr-auto">
          <div className="relative flex items-center">
            <h6 
              className="ml-2.5 text-foreground"
              style={{
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

        <div className="relative hidden justify-center md:flex">
          <Button 
            asChild 
            variant="ghost" 
            size="lg" 
            className="ml-4 text-muted-foreground hover:bg-card/70 hover:text-foreground"
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
            className="text-muted-foreground hover:bg-card/70 hover:text-foreground"
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
            className="text-muted-foreground hover:bg-card/70 hover:text-foreground"
            style={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
            }}
          >
            <Link href="/docs">Docs</Link>
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            size="lg"
            className="mr-4 text-muted-foreground hover:bg-card/70 hover:text-foreground"
            style={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
            }}
          >
            <Link href="/download">Desktop App</Link>
          </Button>
        </div>

        <div className="relative flex items-center justify-end gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-1 hover:bg-card/70 md:hidden"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                <Menu className="h-6 w-6 text-foreground" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] border-border bg-background"
            >
              <SheetHeader>
                <SheetTitle className="text-left text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-4">
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-md transition-colors"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '1rem',
                  }}
                >
                  Home
                </Link>
                <Link 
                  href="/pricing" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-md transition-colors"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '1rem',
                  }}
                >
                  Pricing
                </Link>
                <Link 
                  href="/docs" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-md transition-colors"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '1rem',
                  }}
                >
                  Docs
                </Link>
                <Link 
                  href="/download" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-md transition-colors"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '1rem',
                  }}
                >
                  Desktop App
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {isLoggedIn ? (
            <>
              {/* Welcome text - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1 mr-4">
                <span 
                  className="text-sm text-muted-foreground"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  Welcome,
                </span>
                <span 
                  className="text-sm text-foreground"
                  style={{
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
                  className="p-1 hover:bg-card/70"
                  onClick={toggleDropdown}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                  }}
                >
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/70 shadow-lg backdrop-blur"
                  >
                    <User className="h-5 w-5 text-foreground" />
                  </div>
                </Button>
                
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl shadow-background/40 backdrop-blur"
                  >
                    <div className="py-1">
                      <button
                        onClick={handleDashboard}
                        className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-accent"
                        style={{
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
                        className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-accent"
                        style={{
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
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500,
                minHeight: '44px',
                padding: '8px 16px',
              }}
              className="border border-border bg-card/70 text-foreground transition-opacity hover:bg-accent hover:opacity-90"
            >
              Login
            </Button>
          )}
        </div>
      </div>
  );
};

export default Header;
