'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Como Funciona', href: '#como-funciona' },
  { name: 'Para Quem', href: '#para-quem' },
  { name: 'Vantagens', href: '#por-que-escolher' },
  { name: 'Planos', href: '#planos' },
  { name: 'Sobre Nós', href: '/sobre' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(navigation[0].href)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Scroll detection — passive listener for performance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Scroll Spy Logic
      const scrollPosition = window.scrollY + 120 // 120px offset to detect earlier
      for (let i = navigation.length - 1; i >= 0; i--) {
        const href = navigation[i].href
        if (href.startsWith('#')) {
          const sectionId = href.replace('#', '')
          const section = document.getElementById(sectionId)
          if (section && section.offsetTop <= scrollPosition) {
            setActiveSection(href)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Run once on mount to set initial active section
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Smooth Scroll with Offset for anchor links
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.replace('#', '')
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        const top = targetElement.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({
          top,
          behavior: 'smooth'
        })
        setActiveSection(href)
      }
      if (mobileMenuOpen) closeMobileMenu()
    }
  }

  // ESC key closes mobile menu and returns focus to trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Scroll lock when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 transition-all duration-300">
        <nav
          className="flex items-center justify-between bg-red-50/70 backdrop-blur-xl rounded-full p-2 shadow-[0_8px_30px_rgba(239,68,68,0.08)] border border-red-100"
          aria-label="Navegação principal"
        >
          {/* Logo */}
          <Link
            href="/"
            className="group focus-visible:outline-none flex items-center gap-2 pl-3 lg:pl-4"
          >
            <span className="text-lg font-logo uppercase tracking-[0.25em] font-semibold text-primary-600 transition-opacity duration-300 group-hover:opacity-90">
              PODEROSA AGENDA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 rounded-full p-1 border border-slate-200/50">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "font-medium transition-all duration-300 rounded-full px-5 py-2 text-sm",
                  activeSection === item.href 
                    ? "bg-white text-primary-600 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2 pr-1">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-slate-200/50 text-slate-700 hover:text-slate-900 rounded-full px-6 py-2 bg-slate-100/50 border border-slate-200/50 h-auto font-medium transition-colors"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button
                size="sm"
                className="bg-primary-500 hover:bg-primary-600 text-white border-0 shadow-md shadow-primary-500/20 rounded-full font-semibold px-6 py-2 h-auto focus-visible:ring-primary-500/50 transition-all hover:-translate-y-0.5"
              >
                Começar
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={
              mobileMenuOpen
                ? 'Fechar menu de navegação'
                : 'Abrir menu de navegação'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            className="lg:hidden p-2 pr-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-r-full"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile Menu Panel — inside header for correct top-full positioning */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação mobile"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 lg:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/[0.08]"
            >
              <div className="container-custom py-6 space-y-1">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Link
                      href={item.href}
                      className="block text-white/75 hover:text-white font-medium py-3 px-3 rounded-lg hover:bg-white/[0.05] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50"
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile CTAs */}
                <div className="pt-5 mt-5 border-t border-white/[0.08] space-y-3">
                  <Link href="/login" className="block" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full text-white/80 hover:text-white hover:bg-white/10"
                    >
                      Entrar
                    </Button>
                  </Link>
                  <Link
                    href="/cadastro"
                    className="block"
                    onClick={closeMobileMenu}
                  >
                    <Button
                      variant="primary"
                      className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white border-0"
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop — below header (z-40), covers page content when mobile menu is open */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>
    </>
  )
}