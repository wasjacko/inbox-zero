import type { Metadata } from "next";
import { Testimonials } from "@/components/new-landing/sections/Testimonials";
import { Hero, HeroContent } from "@/app/(landing)/home/Hero";
import { Pricing } from "@/components/new-landing/sections/Pricing";
import { Awards } from "@/components/new-landing/sections/Awards";
import { EverythingElseSection } from "@/components/new-landing/sections/EverythingElseSection";
import { StartedInMinutes } from "@/components/new-landing/sections/StartedInMinutes";
import { BulkUnsubscribe } from "@/components/new-landing/sections/BulkUnsubscribe";
import { OrganizedInbox } from "@/components/new-landing/sections/OrganizedInbox";
import { PreWrittenDrafts } from "@/components/new-landing/sections/PreWrittenDrafts";
import { ManageFromAnywhere } from "@/components/new-landing/sections/ManageFromAnywhere";
import { BasicLayout } from "@/components/layouts/BasicLayout";
import { FAQs } from "@/app/(landing)/home/FAQs";
import { FinalCTA } from "@/app/(landing)/home/FinalCTA";
import { WordReveal } from "@/components/new-landing/common/WordReveal";
import { env } from "@/env";
import { BRAND_NAME } from "@/utils/branding";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function NewLanding() {
  if (env.NEXT_PUBLIC_BYPASS_PREMIUM_CHECKS) {
    return (
      <BasicLayout>
        <Hero
          title={`${BRAND_NAME} pour les équipes indépendantes`}
          subtitle={`Déployez ${BRAND_NAME} sur votre infrastructure et centralisez vos échanges tout en gardant le contrôle de vos données.`}
        />
      </BasicLayout>
    );
  }

  return (
    <BasicLayout>
      <Hero
        title={
          <WordReveal
            spaceBetween="w-2 md:w-3"
            words={[
              "Tous",
              "vos",
              "échanges",
              "clients,",
              "enfin",
              <em key="centralises">centralisés</em>,
            ]}
          />
        }
        subtitle={`${BRAND_NAME} centralise vos échanges, prépare vos réponses et vous aide à avancer sans perdre le contexte.`}
      >
        <HeroContent />
      </Hero>
      <OrganizedInbox
        title={
          <>
            Vos échanges, automatiquement organisés.
            <br />
            Rien d’important ne vous échappe.
          </>
        }
        subtitle="Freescale rassemble et priorise vos conversations pour que vous sachiez toujours quoi traiter ensuite."
      />
      <PreWrittenDrafts
        title="Des réponses préparées dans votre ton"
        subtitle="Mue prépare les réponses utiles à partir du contexte de vos échanges. Vous gardez toujours la décision finale."
      />
      <ManageFromAnywhere />
      <StartedInMinutes
        title="Opérationnel en quelques minutes"
        subtitle="Connectez vos sources, définissez votre périmètre et laissez Freescale organiser le reste."
      />
      <BulkUnsubscribe />
      <EverythingElseSection />
      <Awards />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <FAQs />
    </BasicLayout>
  );
}
