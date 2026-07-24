import { ArrowLeft } from "lucide-react";

interface TermsProps {
  onBack: () => void;
}

export function Terms({ onBack }: TermsProps) {
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
        <h1 className="text-4xl mb-6">Conditions Générales de Vente</h1>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-2xl mb-4">Article 1 - Objet</h2>
            <p className="text-gray-700">
              Les présentes conditions générales de vente régissent les relations contractuelles entre 
              Ma Boutique (ci-après "le Vendeur") et toute personne physique ou morale souhaitant effectuer 
              un achat via le site internet (ci-après "le Client").
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 2 - Commandes</h2>
            <p className="text-gray-700 mb-3">
              Les commandes peuvent être passées directement sur notre site internet. Le processus de commande 
              comprend les étapes suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Sélection des produits et ajout au panier</li>
              <li>Validation du panier</li>
              <li>Renseignement des informations de livraison (nom, prénom, téléphone, adresse complète)</li>
              <li>Confirmation de la commande</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Une fois la commande confirmée, le Client recevra un numéro de commande et sera contacté par 
              téléphone par notre service client pour confirmer les détails de la commande et organiser la livraison.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 3 - Prix et Paiement</h2>
            <p className="text-gray-700 mb-3">
              Les prix de nos produits sont indiqués en euros (€), toutes taxes comprises (TTC).
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Modalités de paiement :</strong> Le paiement s'effectue exclusivement à la livraison. 
              Aucun paiement en ligne n'est requis lors de la passation de la commande. Le Client règle le montant 
              total de sa commande en espèces ou par tout autre moyen convenu au moment de la réception des produits.
            </p>
            <p className="text-gray-700">
              Le Vendeur se réserve le droit de modifier ses prix à tout moment, étant toutefois entendu que 
              le prix figurant sur le site le jour de la commande sera le seul applicable au Client.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 4 - Livraison</h2>
            <p className="text-gray-700 mb-3">
              Les produits sont livrés à l'adresse indiquée par le Client lors de la commande. Le délai de 
              livraison sera communiqué lors de la confirmation téléphonique de la commande.
            </p>
            <p className="text-gray-700 mb-3">
              Les frais de livraison peuvent varier selon la localisation et seront communiqués au Client 
              avant la confirmation définitive de la commande.
            </p>
            <p className="text-gray-700">
              Il est de la responsabilité du Client de vérifier l'état des produits à la réception et de 
              signaler toute anomalie au livreur.
            </p>
          </section>

          <section className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
            <h2 className="text-2xl mb-4">Article 5 - Droit de Rétractation et Retours</h2>
            <p className="text-gray-700 mb-3">
              <strong>Délai de rétractation :</strong> Conformément à la législation en vigueur, le Client 
              dispose d'un délai de <strong className="text-yellow-900">3 jours à compter de la réception 
              des produits</strong> pour exercer son droit de rétractation sans avoir à justifier de motifs 
              ni à payer de pénalités.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Conditions de retour :</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Les produits doivent être retournés dans leur état d'origine</li>
              <li>Les produits doivent être complets (accessoires, emballage, notice...)</li>
              <li>L'emballage d'origine doit être intact</li>
              <li>Les produits ne doivent présenter aucun signe d'utilisation excessive</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Procédure de retour :</strong> Pour exercer son droit de rétractation, le Client 
              doit contacter notre service client par téléphone au 01 23 45 67 89 ou par email à 
              contact@maboutique.com avant l'expiration du délai de 3 jours.
            </p>
            <p className="text-gray-700 mt-3">
              <strong>Remboursement :</strong> En cas de retour accepté, le Client sera remboursé de 
              l'intégralité des sommes versées dans un délai de 14 jours à compter de la réception du 
              produit retourné. Les frais de retour restent à la charge du Client sauf en cas de produit 
              défectueux ou d'erreur de notre part.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 6 - Garanties</h2>
            <p className="text-gray-700 mb-3">
              Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre 
              les vices cachés, conformément aux articles L217-4 et suivants du Code de la consommation.
            </p>
            <p className="text-gray-700 mb-3">
              En outre, certains produits peuvent bénéficier de la garantie constructeur. Les conditions 
              de cette garantie sont détaillées dans la documentation fournie avec le produit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 7 - Responsabilité</h2>
            <p className="text-gray-700 mb-3">
              Le Vendeur ne saurait être tenu responsable de l'inexécution du contrat en cas de rupture 
              de stock, d'indisponibilité du produit, de force majeure, de perturbation ou grève totale 
              ou partielle des services postaux ou de transport.
            </p>
            <p className="text-gray-700">
              Les photographies et graphismes présentés sur le site ne sont pas contractuels et ne sauraient 
              engager la responsabilité du Vendeur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 8 - Protection des Données Personnelles</h2>
            <p className="text-gray-700 mb-3">
              Les informations collectées lors de la commande (nom, prénom, numéro de téléphone, adresse) 
              sont nécessaires au traitement et à la livraison de la commande.
            </p>
            <p className="text-gray-700 mb-3">
              Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement 
              Général sur la Protection des Données (RGPD), le Client dispose d'un droit d'accès, de 
              rectification, de suppression et d'opposition aux données personnelles le concernant.
            </p>
            <p className="text-gray-700">
              Ces droits peuvent être exercés en contactant : contact@maboutique.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 9 - Propriété Intellectuelle</h2>
            <p className="text-gray-700">
              Tous les éléments du site (textes, images, graphismes, logo, icônes, etc.) sont la propriété 
              exclusive du Vendeur ou de ses partenaires. Toute reproduction, représentation, modification, 
              publication ou adaptation de tout ou partie des éléments du site est interdite sans l'autorisation 
              écrite préalable du Vendeur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 10 - Réclamations</h2>
            <p className="text-gray-700 mb-3">
              Pour toute réclamation, le Client peut contacter notre service client :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Par email : contact@maboutique.com</li>
              <li>Par téléphone : 01 23 45 67 89</li>
              <li>Du lundi au samedi de 9h à 18h</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Article 11 - Droit Applicable et Juridiction</h2>
            <p className="text-gray-700 mb-3">
              Les présentes conditions générales de vente sont soumises au droit français.
            </p>
            <p className="text-gray-700">
              En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. 
              À défaut d'accord amiable, le litige sera porté devant les tribunaux compétents.
            </p>
          </section>

          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl mb-4">Acceptation des Conditions</h2>
            <p className="text-gray-700">
              En passant commande sur notre site, le Client reconnaît avoir pris connaissance des présentes 
              conditions générales de vente et les accepter sans réserve.
            </p>
            <p className="text-gray-700 mt-3">
              <em>Dernière mise à jour : Juillet 2026</em>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
