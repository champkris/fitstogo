import Link from 'next/link';
import { Sparkles, ShoppingBag, Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Try Before You Buy,{' '}
                <span className="text-primary-600">Virtually</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-lg">
                See how clothes look on you before purchasing. Shop with
                confidence from Lazada and Shopee using AI-powered virtual
                try-on technology.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg">
                    Browse Products
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/tryon">
                  <Button size="lg" variant="outline">
                    <Sparkles className="mr-2 w-5 h-5" />
                    Try It Now
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-500 rounded-3xl transform rotate-6"></div>
                <div className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        Virtual Try-On Preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Three simple steps to your perfect fit
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Upload Your Photo
              </h3>
              <p className="text-gray-600">
                Take or upload a full-body photo. Your privacy is protected with
                encryption.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Choose Products
              </h3>
              <p className="text-gray-600">
                Browse thousands of clothes from Lazada and Shopee. Filter by
                style, size, and price.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Try On Virtually
              </h3>
              <p className="text-gray-600">
                See how clothes look on you instantly with our AI. Love it? Buy
                directly from the shop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of shoppers who never buy the wrong size again.
          </p>
          <Link href="/register">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-4 text-gray-500">
            No credit card required. 5 free try-ons every month.
          </p>
        </div>
      </section>
    </div>
  );
}
