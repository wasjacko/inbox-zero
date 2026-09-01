import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/utils/branding";

export const metadata: Metadata = {
  title: `Politique de confidentialité | ${BRAND_NAME}`,
  description: `Comment ${BRAND_NAME} collecte, utilise et protège vos données.`,
};

const updatedAt = "1er septembre 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link href="/" className="text-sm font-semibold text-blue-600">
          ← Retour à {BRAND_NAME}
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-sm text-slate-500">Mise à jour : {updatedAt}</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Données que nous traitons
            </h2>
            <p className="mt-3">
              {BRAND_NAME} traite les informations de compte nécessaires à votre
              connexion, ainsi que les données que vous choisissez de relier au
              service. Si vous connectez Google, cela peut inclure votre nom,
              votre adresse e-mail et les messages ou paramètres Gmail requis
              pour fournir les fonctions demandées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Utilisation des données Google
            </h2>
            <p className="mt-3">
              L'accès aux données Google sert uniquement à connecter votre
              messagerie, afficher et organiser vos échanges, créer les actions
              que vous demandez et synchroniser les changements dans Gmail. Nous
              ne vendons pas vos données Google et ne les utilisons pas pour
              entraîner des modèles d'intelligence artificielle généralistes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Conservation et protection
            </h2>
            <p className="mt-3">
              Nous limitons l'accès aux données aux besoins du service et
              appliquons des mesures techniques et organisationnelles pour les
              protéger. Les données sont conservées pendant la durée nécessaire
              au fonctionnement du compte et au respect de nos obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Vos choix</h2>
            <p className="mt-3">
              Vous pouvez déconnecter Google depuis l'application ou depuis les
              paramètres de sécurité de votre compte Google. Vous pouvez aussi
              demander l'accès, la rectification ou la suppression de vos
              données en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-3">
              Pour toute question relative à la confidentialité, écrivez à{" "}
              <a
                className="text-blue-600 underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
