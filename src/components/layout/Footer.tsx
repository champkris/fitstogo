import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">FitsToGo</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Virtual try-on marketplace powered by AI. See how clothes look on
              you before you buy. Shop with confidence from Lazada and Shopee.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/tryon"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Virtual Try-On
                </Link>
              </li>
              <li>
                <Link
                  href="/subscription"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900">
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} FitsToGo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
