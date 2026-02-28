export default function LocationMap() {
  return (
    <section className="py-20 bg-green-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Info */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Find Us in Columbus, OH
            </h2>
            <div className="space-y-5 text-green-100">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📍</span>
                <div>
                  <div className="font-semibold text-white">Primary Training Facility</div>
                  <div>3500 Olentangy River Rd, Columbus, OH 43214</div>
                  <div className="text-sm mt-1">Near Easton Town Center • Free parking</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🕐</span>
                <div>
                  <div className="font-semibold text-white">Training Hours</div>
                  <div>Monday – Friday: 3 PM – 8 PM</div>
                  <div>Saturday: 8 AM – 6 PM</div>
                  <div>Sunday: 10 AM – 4 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📞</span>
                <div>
                  <div className="font-semibold text-white">Get in Touch</div>
                  <a href="tel:+16145550100" className="hover:text-yellow-300 transition-colors">
                    (614) 555-0100
                  </a>
                  <div className="mt-1">
                    <a
                      href="mailto:info@kanteelite.com"
                      className="hover:text-yellow-300 transition-colors"
                    >
                      info@kanteelite.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Static map placeholder */}
          <div className="bg-green-800 rounded-2xl overflow-hidden h-72 md:h-96 flex items-center justify-center">
            <div className="text-center text-green-300">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="font-semibold">Columbus, OH 43214</div>
              <div className="text-sm mt-1">3500 Olentangy River Rd</div>
              <a
                href="https://maps.google.com/?q=3500+Olentangy+River+Rd,Columbus,OH"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-yellow-400 text-green-900 font-bold px-5 py-2 rounded-xl hover:bg-yellow-300 transition-colors text-sm"
              >
                Open in Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
