interface FooterProps {
  onNavigate: (view: "about" | "terms" | "admin") => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About section */}
          <div>
            <h3 className="text-lg mb-4">Ma Boutique</h3>
            <p className="text-gray-300 text-sm">
              Votre destination pour l'achat de produits électroniques de qualité. 
              Paiement à la livraison et retour possible sous 3 jours.
            </p>
          </div>

          {/* Links section */}
          <div>
            <h3 className="text-lg mb-4">Liens utiles</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  À propos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("terms")}
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Conditions générales de vente
                </button>
              </li>
            </ul>
          </div>

          {/* Contact section */}
          <div>
            <h3 className="text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>📧 contact@maboutique.com</li>
              <li>📞 01 23 45 67 89</li>
              <li>🕒 Lun-Sam : 9h-18h</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 Ma Boutique. Tous droits réservés.</p>
          <button
            onClick={() => onNavigate("admin")}
            className="text-gray-500 hover:text-gray-400 text-xs mt-2 transition-colors"
          >
            Administration
          </button>
        </div>
      </div>
    </footer>
  );
}