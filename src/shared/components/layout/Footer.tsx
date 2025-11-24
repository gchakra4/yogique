import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NewsletterSignup } from '../../../features/marketing/components/NewsletterSignup'
import { useSettings } from '../../contexts/SettingsContext'

export function Footer() {
  const { settings = {} } = useSettings() || {}

  const profile = settings.business_profile || {}
  const contact = settings.business_contact || {}
  const social = settings.social_links || {}
  const legal = settings.legal_disclaimer || {}

  const brandName = profile.name || 'Yogique'
  // Prefer a footer-specific logo if present, then fall back to the general profile logo
  const logoUrl = profile.footer_logo_url || profile.logo_url || ''
  const description = profile.tagline || 'Transform your life through the ancient practice of yoga.'
  const email = contact.email || 'info@Yogique.com'
  const phone = contact.phone || '+1 (555) 123-4567'
  const addressLines = (contact.address_lines && contact.address_lines.join('\n')) || 'Flat 3C, 3rd Floor, Annapurna Apartment\n15 Garia Station Road\nKolkata 700084'

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-white border-t border-slate-800 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              {logoUrl ? (
                // render logo image directly to avoid clipping/background
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brandName} className="w-10 h-10 object-contain" />
              ) : (
                // fallback to public image for footer
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/Brand.png" alt={brandName} className="w-10 h-10 object-contain" />
              )}
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{brandName}</span>
                <span className="text-sm text-gray-300 mt-1 max-w-md">{description}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              {social.facebook ? (
                <a href={social.facebook} className="text-gray-400 hover:text-emerald-400 transition-colors"><Facebook size={20} /></a>
              ) : (
                <a href="https://www.facebook.com/Yogique" className="text-gray-400 hover:text-emerald-400 transition-colors"><Facebook size={20} /></a>
              )}
              {social.instagram ? (
                <a href={social.instagram} className="text-gray-400 hover:text-emerald-400 transition-colors"><Instagram size={20} /></a>
              ) : (
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors"><Instagram size={20} /></a>
              )}
              {social.youtube ? (
                <a href={social.youtube} className="text-gray-400 hover:text-emerald-400 transition-colors"><Youtube size={20} /></a>
              ) : (
                <a href="https://www.youtube.com/@Yogique1628" className="text-gray-400 hover:text-emerald-400 transition-colors"><Youtube size={20} /></a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/book-class" className="text-gray-300 hover:text-emerald-400 transition-colors">Book Class</Link></li>
              <li><Link to="/learning" className="text-gray-300 hover:text-emerald-400 transition-colors">Learning Center</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/testimonials" className="text-gray-300 hover:text-emerald-400 transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-emerald-400" />
                <span className="text-gray-300">{email}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-emerald-400" />
                <span className="text-gray-300">{phone}</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="text-emerald-400 mt-1" />
                <span className="text-gray-300 whitespace-pre-line">{addressLines}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md mx-auto">
            <NewsletterSignup
              className="bg-gray-800 border border-gray-700"
              showTitle={false}
            />
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Yogique is a brand operating under the umbrella of <span className="font-semibold text-gray-300">Sampurnayogam LLP</span> (a registered company). All services, including online B2C classes and programs, are offered by Sampurnayogam LLP.
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-semibold text-gray-300">Sampurnayogam LLP</span>
              {' '}• LLPIN: {legal.llpin || 'ACS-6592'}
              {' '}• Registered Office: {contact.address_lines?.length ? contact.address_lines.join(', ') : 'Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084'}
            </p>
            <p className="text-gray-400">
              © {new Date().getFullYear()} {brandName} • Sampurnayogam LLP. All rights reserved.
              {' '}
              <Link to="/privacy" className="text-gray-300 hover:text-emerald-400 underline ml-2">Privacy Policy</Link>
              {' '}
              <Link to="/terms" className="text-gray-300 hover:text-emerald-400 underline ml-2">Terms of Service</Link>
              {legal.disclaimer ? '' : ' Made with ❤️ for your wellness journey.'}
            </p>
          </div>
        </div>
      </div>
    </footer >
  )
}

