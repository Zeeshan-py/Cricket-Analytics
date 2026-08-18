"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/ui/Icon";
import { SearchBar } from "@/components/ui/SearchBar";
import { exploreNav, primaryNav } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileExploreOpen, setIsMobileExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setIsExploreOpen(false);
    setIsMobileExploreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isExploreOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!exploreRef.current?.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExploreOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExploreOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isExploreActive = exploreNav.some((item) => isActive(item.href));
  const closeMobileNavigation = () => {
    setIsOpen(false);
    setIsMobileExploreOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand-link" href="/" aria-label={`${siteConfig.name} home`}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">{siteConfig.name}</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/" aria-current={isActive("/") ? "page" : undefined}>
            Home
          </Link>
          <div className="desktop-nav-group" ref={exploreRef}>
            <button
              className="desktop-nav-trigger"
              type="button"
              aria-expanded={isExploreOpen}
              aria-controls="desktop-explore-menu"
              data-active={isExploreActive ? "true" : undefined}
              onClick={() => setIsExploreOpen((value) => !value)}
            >
              Explore
              <ChevronDownIcon />
            </button>
            {isExploreOpen ? (
              <div id="desktop-explore-menu" className="desktop-nav-menu">
                {exploreNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setIsExploreOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {primaryNav
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="header-search">
          <SearchBar id="global-search" />
        </div>

        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div id="mobile-navigation" className={`mobile-nav-panel ${isOpen ? "is-open" : ""}`}>
        <div className="container mobile-nav-inner">
          <nav aria-label="Mobile navigation">
            <Link href="/" aria-current={isActive("/") ? "page" : undefined} onClick={closeMobileNavigation}>
              Home
            </Link>
            <div className="mobile-explore">
              <button
                className="mobile-explore-toggle"
                type="button"
                aria-expanded={isMobileExploreOpen}
                aria-controls="mobile-explore-menu"
                data-active={isExploreActive ? "true" : undefined}
                onClick={() => setIsMobileExploreOpen((value) => !value)}
              >
                Explore
                <ChevronDownIcon />
              </button>
              {isMobileExploreOpen ? (
                <div id="mobile-explore-menu" className="mobile-explore-panel">
                  {exploreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={closeMobileNavigation}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            {primaryNav
              .filter((item) => item.href !== "/")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={closeMobileNavigation}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
          <div className="mobile-menu-search">
            <SearchBar id="mobile-search" />
          </div>
        </div>
      </div>
    </header>
  );
}
