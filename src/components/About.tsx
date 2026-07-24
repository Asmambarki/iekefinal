import { ArrowLeft, Store, Truck, Shield, HeadphonesIcon } from "lucide-react";

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à l'accueil
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl mb-6">À propos de Ma Boutique</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl mb-4">Qui sommes-nous ?</h2>
            <p className="text-gray-700 mb-4">
              Ma Boutique est votre destination privilégiée pour l'achat de produits électroniques de qualité. 
              Depuis notre création, nous nous engageons à offrir à nos clients les meilleurs produits technologiques 
              au meilleur rapport qualité-prix.
            </p>
            <p className="text-gray-700 mb-4">
              Notre mission est de rendre la technologie accessible à tous, en proposant une sélection rigoureuse 
              de produits et un service client irréprochable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-6">Nos engagements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-2">Produits authentiques</h3>
                  <p className="text-gray-700 text-sm">
                    Tous nos produits sont 100% authentiques et proviennent de sources fiables et certifiées.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-2">Livraison rapide</h3>
                  <p className="text-gray-700 text-sm">
                    Nous assurons une livraison rapide et sécurisée de vos commandes à l'adresse de votre choix.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-2">Garantie satisfait ou remboursé</h3>
                  <p className="text-gray-700 text-sm">
                    Droit de retour de 3 jours. Votre satisfaction est notre priorité absolue.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <HeadphonesIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-2">Service client</h3>
                  <p className="text-gray-700 text-sm">
                    Notre équipe est à votre écoute pour répondre à toutes vos questions et vous accompagner.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Notre processus de commande</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Parcourez notre catalogue et ajoutez vos produits préférés au panier</li>
              <li>Remplissez le formulaire avec vos coordonnées de livraison</li>
              <li>Confirmez votre commande - aucun paiement en ligne requis</li>
              <li>Nous vous contactons par téléphone pour confirmer les détails</li>
              <li>Recevez votre commande et payez à la livraison</li>
            </ol>
          </section>

          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl mb-4">Contactez-nous</h2>
            <p className="text-gray-700 mb-2">
              Vous avez des questions ? N'hésitez pas à nous contacter :
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>📧 Email : contact@maboutique.com</li>
              <li>📞 Téléphone : 01 23 45 67 89</li>
              <li>🕒 Horaires : Du lundi au samedi, 9h-18h</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
